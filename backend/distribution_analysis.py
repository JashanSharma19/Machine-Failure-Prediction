import numpy as np
from scipy import stats, optimize

def fit(df):
    # Right-censored likelihoods are used for both fits.
    t=df.failure_time.to_numpy(float); d=df.failure_status.to_numpy(int); out=[]
    for name in ["exponential","weibull","normal"]:
        if name=="exponential":
            scale=float(np.sum(t)/max(np.sum(d),1)); ll=float(np.sum(stats.expon.logpdf(t[d==1],scale=scale))+np.sum(stats.expon.logsf(t[d==0],scale=scale)))
            params={"rate_lambda":1/scale,"scale":scale}; cdf=lambda z: stats.expon.cdf(z,scale=scale); sf=lambda z: stats.expon.sf(z,scale=scale); k=1
        elif name=="weibull":
            def nll(theta):
                shape,scale=np.exp(theta); return -float(np.sum(stats.weibull_min.logpdf(t[d==1],shape,scale=scale))+np.sum(stats.weibull_min.logsf(t[d==0],shape,scale=scale)))
            opt=optimize.minimize(nll,np.log([1.5,max(np.mean(t),.1)]),method="Nelder-Mead"); shape,scale=np.exp(opt.x); ll=-float(opt.fun)
            params={"shape_beta":float(shape),"scale_eta":float(scale)}; k=2
        else:
            def nll(theta):
                mu,sigma=theta[0],np.exp(theta[1]); return -float(np.sum(stats.norm.logpdf(t[d==1],loc=mu,scale=sigma))+np.sum(stats.norm.logsf(t[d==0],loc=mu,scale=sigma)))
            opt=optimize.minimize(nll,[float(np.mean(t)),np.log(max(float(np.std(t)),.1))],method="Nelder-Mead"); mu,sigma=opt.x[0],np.exp(opt.x[1]); ll=-float(opt.fun)
            params={"mean_mu":float(mu),"std_sigma":float(sigma)}; k=2
        def density(z):
            if name=="exponential": return stats.expon.pdf(z,scale=1/params['rate_lambda'])
            if name=="weibull": return stats.weibull_min.pdf(z,params['shape_beta'],scale=params['scale_eta'])
            return stats.norm.pdf(z,loc=params['mean_mu'],scale=params['std_sigma'])
        out.append({"name":name,"parameters":params,"log_likelihood":ll,"aic":2*k-2*ll,"curve":[{"hours":float(z),"density":float(density(z))} for z in np.linspace(0,max(t.max(),1),60)],"goodness_of_fit":"Censored likelihood AIC; lower is preferred among tested models"})
    best=min(out,key=lambda x:x["aic"])["name"]
    return {"models":out,"best_fit":best,"interpretation":"Best fit among the tested models by AIC; this does not guarantee the model is correct. Normal fits may assign probability to negative lifetimes and are excluded from reliability forecasting."}
