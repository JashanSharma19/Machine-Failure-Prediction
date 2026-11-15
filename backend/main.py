import json
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
try:
    from .database import Base, engine, SessionLocal
    from .models import Dataset
    from .schemas import GenerateRequest, PredictRequest, ChatRequest, FTestRequest
    from .data_generator import generate
    from .statistical_analysis import analyze
    from .distribution_analysis import fit
    from .f_test import compare
    from .reliability import predict
    from .insights import build
    from .ai_assistant import answer
    from .report_generator import create_report
except ImportError:
    from database import Base, engine, SessionLocal
    from models import Dataset
    from schemas import GenerateRequest, PredictRequest, ChatRequest, FTestRequest
    from data_generator import generate
    from statistical_analysis import analyze
    from distribution_analysis import fit
    from f_test import compare
    from reliability import predict
    from insights import build
    from ai_assistant import answer
    from report_generator import create_report

Base.metadata.create_all(bind=engine)
app=FastAPI(title="MACHINEPRED AI",version="1.0")
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
def db_session():
    db=SessionLocal()
    try: yield db
    finally: db.close()
def get_data(db,id):
    ds=db.get(Dataset,id)
    if not ds: raise HTTPException(404,"Dataset not found")
    import pandas as pd
    return ds,pd.DataFrame(json.loads(ds.rows))
def model_for(df, dist=None, group=None):
    from scipy import stats
    subset=df if group is None else df[df.machine_group==group]
    result=fit(subset); name=dist or min((m for m in result["models"] if m["name"] in ("exponential","weibull")),key=lambda m:m["aic"])["name"]
    return next(m for m in result["models"] if m["name"]==name),result

@app.get("/api/health")
def health(): return {"status":"online","mode":"deterministic statistical engine"}
@app.get("/api/datasets")
def datasets(db:Session=Depends(db_session)): return [{"id":d.id,"name":d.name,"created_at":str(d.created_at)} for d in db.query(Dataset).order_by(Dataset.id.desc()).all()]
@app.post("/api/datasets")
def create_dataset(req:GenerateRequest,db:Session=Depends(db_session)):
    if len(set(req.groups))<2: raise HTTPException(422,"Provide at least two unique groups")
    config=req.model_dump(); df=generate(config); ds=Dataset(name=f"Simulated {req.distribution.title()} · {req.count} machines",config=json.dumps(config),rows=df.to_json(orient="records")); db.add(ds); db.commit(); db.refresh(ds)
    return {"id":ds.id,"name":ds.name,"config":config,"rows":json.loads(ds.rows)}
@app.get("/api/datasets/{dataset_id}")
def dataset(dataset_id:int,db:Session=Depends(db_session)):
    ds,df=get_data(db,dataset_id); return {"id":ds.id,"name":ds.name,"config":json.loads(ds.config),"rows":json.loads(ds.rows)}
@app.get("/api/datasets/{dataset_id}/analysis")
def analysis(dataset_id:int,db:Session=Depends(db_session)):
    ds,df=get_data(db,dataset_id); stats=analyze(df); fits=fit(df); groups=sorted(df.machine_group.unique().tolist())
    group_results=[]
    for g in groups:
        sub=df[df.machine_group==g]; s=analyze(sub); m,_=model_for(df,group=g); group_results.append({"group":g,"count":len(sub),"mean":s.get("mean"),"variance":s.get("variance"),"reliability_200":predict(m,200)["reliability"]})
    insights=build(stats,fits)
    return {"dataset_id":dataset_id,"stats":stats,"distributions":fits,"groups":group_results,"insights":insights,"histogram":[{"bin":float(x),"count":int(n)} for n,x in zip(*__import__('numpy').histogram(df.failure_time,bins=18))],"rows":len(df)}
@app.post("/api/f-test")
def ftest(req:FTestRequest,db:Session=Depends(db_session)):
    _,df=get_data(db,req.dataset_id)
    if req.group_a==req.group_b: raise HTTPException(422,"Select two different machine groups.")
    try: return compare(df,req.group_a,req.group_b,req.alpha)
    except ValueError as e: raise HTTPException(422,str(e))
@app.post("/api/reliability")
def reliability(req:PredictRequest,db:Session=Depends(db_session)):
    _,df=get_data(db,req.dataset_id)
    try: model,fits=model_for(df,req.distribution,req.group); out=predict(model,req.hours,req.age); out.update({"model":model,"fit_summary":fits["interpretation"]}); return out
    except ValueError as e: raise HTTPException(422,str(e))
@app.get("/api/risk/{dataset_id}")
def risk(dataset_id:int,hours:float=200,db:Session=Depends(db_session)):
    _,df=get_data(db,dataset_id); result=[]
    for _,row in df.iterrows():
        model,_=model_for(df,group=row.machine_group); p=predict(model,hours,float(row.operating_hours)); result.append({"machine_id":row.machine_id,"machine_group":row.machine_group,"observed_runtime":float(row.operating_hours),"reliability":p["reliability"],"failure_probability":p["failure_probability"],"risk_category":p["risk_category"]})
    return {"horizon_hours":hours,"rows":result}
@app.get("/api/insights/{dataset_id}")
def insights(dataset_id:int,db:Session=Depends(db_session)):
    _,df=get_data(db,dataset_id); return {"insights":build(analyze(df),fit(df))}
@app.post("/api/chat")
def chat(req:ChatRequest,db:Session=Depends(db_session)):
    _,df=get_data(db,req.dataset_id); return {"mode":"rule-based","answer":answer(req.question,analyze(df),fit(df),sorted(df.machine_group.unique()))}
@app.get("/api/export/{dataset_id}.csv")
def export_csv(dataset_id:int,db:Session=Depends(db_session)):
    ds,df=get_data(db,dataset_id); return StreamingResponse(iter([df.to_csv(index=False)]),media_type="text/csv",headers={"Content-Disposition":f"attachment; filename=machinepred-{dataset_id}.csv"})
@app.get("/api/report/{dataset_id}.pdf")
def report(dataset_id:int,db:Session=Depends(db_session)):
    ds,df=get_data(db,dataset_id); stats=analyze(df); fits=fit(df); summary={"Dataset":ds.name,"Statistical summary":stats,"Distribution analysis":fits,"Insights":build(stats,fits),"Limitations":"Simulated data. Population model estimates do not identify exact failure times. F-test assumptions should be checked."}; buf=create_report(summary)
    return StreamingResponse(buf,media_type="application/pdf",headers={"Content-Disposition":f"attachment; filename=machinepred-{dataset_id}-report.pdf"})
