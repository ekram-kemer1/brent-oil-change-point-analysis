"""
Bayesian single change point model for the Brent oil log-return series, built in PyMC.

Model:
    tau        ~ DiscreteUniform(0, n-1)          # switch point index
    mu_1       ~ Normal(0, sigma=0.05)             # mean return before tau
    mu_2       ~ Normal(0, sigma=0.05)             # mean return after tau
    sigma      ~ HalfNormal(0.05)                  # shared volatility
    mu_t       = switch(t <= tau, mu_1, mu_2)
    return_t   ~ Normal(mu_t, sigma)
"""
from pathlib import Path

import numpy as np
import pandas as pd
import pymc as pm
import arviz as az

RESULTS_DIR = Path(__file__).resolve().parents[1] / "reports"


def fit_change_point_model(
    log_returns: np.ndarray,
    draws: int = 3000,
    tune: int = 3000,
    chains: int = 4,
    random_seed: int = 42,
) -> az.InferenceData:
    """Fit a single change point model to a 1D array of log returns."""
    n = len(log_returns)
    t = np.arange(n)

    with pm.Model() as model:
        tau = pm.DiscreteUniform("tau", lower=0, upper=n - 1)
        mu_1 = pm.Normal("mu_1", mu=0, sigma=0.05)
        mu_2 = pm.Normal("mu_2", mu=0, sigma=0.05)
        sigma = pm.HalfNormal("sigma", sigma=0.05)

        mu_t = pm.math.switch(t <= tau, mu_1, mu_2)

        pm.Normal("obs", mu=mu_t, sigma=sigma, observed=log_returns)

        idata = pm.sample(
            draws=draws,
            tune=tune,
            chains=chains,
            cores=1,
            random_seed=random_seed,
            target_accept=0.97,
            progressbar=True,
        )
    return idata


def summarize_change_point(idata: az.InferenceData, dates: pd.Series) -> dict:
    """Convert posterior tau (an index) into a calendar date and summarize the shift."""
    tau_samples = idata.posterior["tau"].values.flatten()
    tau_mode = int(pd.Series(tau_samples).mode().iloc[0])
    tau_date = dates.iloc[tau_mode]

    mu_1_samples = idata.posterior["mu_1"].values.flatten()
    mu_2_samples = idata.posterior["mu_2"].values.flatten()

    mu_1_mean = float(mu_1_samples.mean())
    mu_2_mean = float(mu_2_samples.mean())
    prob_increase = float((mu_2_samples > mu_1_samples).mean())

    return {
        "tau_index_mode": tau_mode,
        "tau_date": str(pd.Timestamp(tau_date).date()),
        "tau_index_hdi_3%": float(az.hdi(tau_samples, prob=0.94)[0]),
        "tau_index_hdi_97%": float(az.hdi(tau_samples, prob=0.94)[1]),
        "mu_1_mean_log_return": mu_1_mean,
        "mu_2_mean_log_return": mu_2_mean,
        "pct_change_mean_return": float((mu_2_mean - mu_1_mean) / abs(mu_1_mean) * 100) if mu_1_mean != 0 else None,
        "probability_mean_increased": prob_increase,
    }


def nearest_event(tau_date: str, events: pd.DataFrame, max_days: int = 30) -> dict | None:
    """Find the closest researched event to the detected change point date, within max_days."""
    tau_ts = pd.Timestamp(tau_date)
    events = events.copy()
    events["days_diff"] = (events["start_date"] - tau_ts).dt.days.abs()
    closest = events.sort_values("days_diff").iloc[0]
    if closest["days_diff"] > max_days:
        return None
    return {
        "event_name": closest["event_name"],
        "start_date": str(closest["start_date"].date()),
        "category": closest["category"],
        "description": closest["description"],
        "days_from_change_point": int(closest["days_diff"]),
    }