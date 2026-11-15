def answer(question, stats, fits, groups, prediction=None):
    q=question.lower()
    if "average" in q or "mean" in q: return f"The mean observed failure time is {stats.get('mean',0):.1f} operating hours across observed failures. This is descriptive and may be biased if runtimes are censored."
    if "weibull" in q: return "The Weibull model uses shape β and scale η. β below 1 suggests a decreasing hazard, β near 1 resembles a constant hazard, and β above 1 suggests an increasing hazard. It is a fitted population model, not an exact prediction for one machine."
    if "reliable" in q or "group" in q: return "Reliability comparisons should use the same time horizon. Group summaries are estimates from this simulated dataset; choose a group in Reliability Prediction to calculate its fitted survival curve."
    if "f-test" in q or "p-value" in q: return "A p-value is the probability, assuming equal population variances and the test assumptions, of seeing a result at least this extreme. A small p-value is evidence against equal variances, not a measure of practical importance."
    if "variance" in q: return f"The sample variance is {stats.get('variance',0):.1f} hours². It squares deviations from the mean, so a few unusually short or long runtimes can raise it."
    if "200" in q and prediction: return f"The fitted model estimates {prediction['reliability']:.1%} reliability over the requested interval. This is a population estimate, not a guarantee for an individual machine."
    return f"I can explain the current analysis: {stats.get('n_failures',0)} observed failures and {stats.get('n_censored',0)} censored runtimes. Ask about the mean, variance, Weibull model, F-test, groups, or reliability. I use deterministic explanations and do not call a generative model."
