# MACHINEPRED AI

**Predict. Analyse. Prevent.** A locally runnable machine reliability analysis project for a B.Tech Probability and Statistics demonstration. The dashboard simulates failure-time data, stores it in SQLite, fits reliability distributions, compares group variances, and provides deterministic statistical explanations.

## Abstract and objectives

Machine failure is uncertain, but reliability data can help describe that uncertainty. MACHINEPRED AI demonstrates how probability distributions, descriptive statistics, hypothesis testing, and survival probability can support reliability analysis. All statistical calculations run in the Python backend. The sample data are simulated and are not maintenance recommendations.

## Concepts

- Sample variance: `s² = Σ(xᵢ − x̄)² / (n − 1)`; the project labels this convention explicitly.
- Exponential reliability: `R(t) = exp(−λt)`, with constant hazard rate λ.
- Weibull reliability: `R(t) = exp(−(t/η)^β)`; β is shape and η is scale.
- Conditional survival: `P(T > a + Δt | T > a) = R(a + Δt) / R(a)`.
- AIC: `2k − 2 log(L)`; lower AIC indicates relative preference among the tested models, not proof of correctness.
- Two-sided F test: tests equality of two population variances under independent, approximately normal samples.

When right censoring is enabled, distribution likelihoods include survival contributions for censored rows. Descriptive statistics use observed failures and are not an MTTF estimate under censoring. Normal distributions can assign probability to negative times, so are often less suitable for positive lifetime analysis.

## Architecture

React + Vite dashboard → FastAPI REST API → Python (NumPy, Pandas, SciPy) → SQLite (SQLAlchemy). The rule-based ReliBot uses current computed results; it is not a generative AI model. No API key is needed.

## Run locally

Prerequisites: Python 3.10+ and Node.js 18+.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). The UI creates a reproducible starter dataset on first use. SQLite persists datasets in `backend/machinepred.db`. API docs are at `http://localhost:8000/docs`.

Optional frontend API override: create `frontend/.env` with `VITE_API_URL=http://localhost:8000/api`.

## Workflow and API

Generate a dataset in **Data Simulation**, then select it in the top bar. All analysis pages use that selected dataset.

- `POST /api/datasets`, `GET /api/datasets`, `GET /api/datasets/{id}`
- `GET /api/datasets/{id}/analysis`, `GET /api/insights/{id}`
- `POST /api/f-test`, `POST /api/reliability`, `GET /api/risk/{id}`
- `POST /api/chat`
- `GET /api/export/{id}.csv`, `GET /api/report/{id}.pdf`

## Limitations and future work

Data are synthetic; group shifts are illustrative. The classical F test is sensitive to non-normality and independence violations. Models are compared by AIC and do not guarantee future outcomes. The current interface includes exponential and Weibull lifetime curves; a normal fit can be added for comparison while clearly noting the negative-time limitation. Optional LLM integration, confidence intervals, and external datasets are future extensions.
