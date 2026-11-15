import math
from scipy.special import gamma
from scipy.stats import norm

def survival(model, t):
    p=model["parameters"]
    t=max(float(t),0)
    if model["name"]=="exponential": return math.exp(-p["rate_lambda"]*t)
    if model["name"]=="normal": return float(norm.sf(t,loc=p["mean_mu"],scale=p["std_sigma"]))
    return math.exp(-((t/p["scale_eta"])**p["shape_beta"]))

def predict(model,hours,age=0):
    base=survival(model,age); rel=survival(model,age+hours)/base if base else 0
    return {"hours":hours,"age":age,"reliability":rel,"failure_probability":1-rel,"conditional":age>0,"risk_category":"High reliability" if rel>=.8 else "Moderate reliability" if rel>=.5 else "Low reliability","milestones":{str(h):survival(model,h) for h in [50,100,200,500]},"expected_lifetime":(1/model["parameters"]["rate_lambda"] if model["name"]=="exponential" else model["parameters"]["scale_eta"]*gamma(1+1/model["parameters"]["shape_beta"]))}
