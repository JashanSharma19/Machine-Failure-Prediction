def build(stats, fits, ftest=None):
    items=[]
    if stats.get("coefficient_of_variation",0)>.5: items.append("Failure times show high relative variability (coefficient of variation above 0.5).")
    if stats.get("min") and stats.get("mean") and stats["min"]<.25*stats["mean"]: items.append("At least one observed failure time is unusually short compared with the mean.")
    if fits: items.append(f"{fits['best_fit'].title()} has the lowest AIC among the tested models; model selection is comparative, not definitive.")
    if ftest and ftest["significant"]: items.append("The selected groups show statistically significant variance differences at the chosen alpha level.")
    if not items: items.append("Observed failure-time variability is within the configured review threshold; keep interpreting estimates in the context of this simulated dataset.")
    return items[:3]
