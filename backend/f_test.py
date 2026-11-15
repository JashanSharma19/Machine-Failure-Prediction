from scipy import stats
import numpy as np

def compare(df,a,b,alpha=.05):
    x=df[(df.machine_group==a)&(df.failure_status==1)].failure_time.to_numpy(float); y=df[(df.machine_group==b)&(df.failure_status==1)].failure_time.to_numpy(float)
    if len(x)<2 or len(y)<2: raise ValueError("Each group needs at least two observed failures.")
    va,vb=np.var(x,ddof=1),np.var(y,ddof=1); f=va/vb; d1,d2=len(x)-1,len(y)-1
    p=min(1.,2*min(stats.f.cdf(f,d1,d2),stats.f.sf(f,d1,d2)))
    lo,hi=stats.f.ppf(alpha/2,d1,d2),stats.f.ppf(1-alpha/2,d1,d2)
    significant=bool(p<alpha)
    return {"group_a":a,"group_b":b,"variance_a":float(va),"variance_b":float(vb),"f_statistic":float(f),"df_num":d1,"df_den":d2,"p_value":float(p),"alpha":alpha,"lower_critical":float(lo),"upper_critical":float(hi),"significant":significant,"conclusion":"Evidence of unequal variances" if significant else "Insufficient evidence of unequal variances","assumption_warning":"Classical F-test assumes independent, approximately normal samples; censored rows are excluded."}
