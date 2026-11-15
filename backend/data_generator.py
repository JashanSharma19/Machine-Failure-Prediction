import numpy as np
import pandas as pd

def generate(config: dict) -> pd.DataFrame:
    rng = np.random.default_rng(config.get("seed"))
    n, groups = config["count"], config["groups"]
    group = np.resize(np.array(groups), n)
    # Group shifts make comparison useful while retaining a known base model.
    factors = {g: 1 + (i - (len(groups)-1)/2) * .15 for i, g in enumerate(groups)}
    mult = np.array([factors[g] for g in group])
    scale, shape = config["scale"], config["shape"]
    if config["distribution"] == "exponential":
        failure = rng.exponential(scale * mult)
    else:
        failure = rng.weibull(shape, n) * scale * mult
    failure = np.maximum(failure, .01)
    status = np.ones(n, dtype=int)
    observed = failure.copy()
    if config.get("censoring"):
        observed = np.minimum(failure, config["censor_hours"])
        status = (failure <= config["censor_hours"]).astype(int)
    return pd.DataFrame({"machine_id":[f"M{i+1:04}" for i in range(n)], "machine_group":group,
      "operating_hours":observed.round(2), "failure_time":observed.round(2), "failure_status":status,
      "operating_condition":rng.choice(["Normal","Elevated load","High temperature"], n, p=[.65,.22,.13])})
