import numpy as np
from scipy import stats

def analyze(df):
    x=df.loc[df.failure_status==1,"failure_time"].to_numpy(float)
    if len(x)<2: return {"n_failures":len(x),"n_censored":int((df.failure_status==0).sum()),"mttf":None,"warning":"At least two observed failures are required for descriptive statistics."}
    mode=stats.mode(x,keepdims=False)
    q1,q3=np.quantile(x,[.25,.75])
    censored=bool((df.failure_status==0).any())
    return {"n":len(df),"n_failures":len(x),"n_censored":int((df.failure_status==0).sum()),"mean":float(np.mean(x)),"median":float(np.median(x)),"mode":float(mode.mode),"variance":float(np.var(x,ddof=1)),"std_dev":float(np.std(x,ddof=1)),"min":float(np.min(x)),"max":float(np.max(x)),"q1":float(q1),"q3":float(q3),"coefficient_of_variation":float(np.std(x,ddof=1)/np.mean(x)),"mttf":None if censored else float(np.mean(x)),"variance_convention":"Sample variance (ddof=1), observed failures only","censoring_warning":"Descriptive summaries exclude censored runtimes; MTTF is not estimated from observed failures alone." if censored else None}
