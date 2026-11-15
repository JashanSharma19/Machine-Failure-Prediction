import pandas as pd
from data_generator import generate
from statistical_analysis import analyze
from distribution_analysis import fit
from f_test import compare
from reliability import survival, predict
from schemas import GenerateRequest

def test_seeded_simulation_reproducible():
    cfg={"seed":7,"count":50,"groups":["A","B"],"distribution":"exponential","scale":100,"shape":1.5,"censoring":False}
    assert generate(cfg).equals(generate(cfg))

def test_simulation_accepts_a_single_group():
    req=GenerateRequest(count=50,groups=["A"],distribution="weibull",scale=100,shape=1.5,seed=4)
    df=generate(req.model_dump())
    assert len(df)==50 and set(df.machine_group)=={"A"}

def test_sample_variance_uses_n_minus_one():
    df=pd.DataFrame({"failure_time":[1.,2.,3.],"failure_status":[1,1,1]})
    assert analyze(df)["variance"]==1

def test_censoring_disables_naive_mttf():
    df=pd.DataFrame({"failure_time":[2.,4.,5.],"failure_status":[1,1,0]})
    assert analyze(df)["mttf"] is None

def test_distribution_fits_and_aic():
    cfg={"seed":9,"count":90,"groups":["A","B"],"distribution":"weibull","scale":100,"shape":1.4,"censoring":True,"censor_hours":80}
    result=fit(generate(cfg)); assert {m["name"] for m in result["models"]}=={"weibull","exponential","normal"}; assert all(m["aic"]<float('inf') for m in result["models"])

def test_f_test_basic_and_two_sided():
    df=pd.DataFrame({"machine_group":["A"]*4+["B"]*4,"failure_status":[1]*8,"failure_time":[1.,2.,3.,4.,2.,4.,6.,8.]})
    result=compare(df,"A","B"); assert result["f_statistic"]==.25 and 0<=result["p_value"]<=1 and type(result["significant"]) is bool

def test_reliability_and_conditional_formula():
    m={"name":"exponential","parameters":{"rate_lambda":.01}}
    assert abs(survival(m,100)-__import__('math').exp(-1))<1e-10
    p=predict(m,50,age=100); assert abs(p["reliability"]-survival(m,150)/survival(m,100))<1e-10
