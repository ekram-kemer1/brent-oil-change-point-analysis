# Assumptions and Limitations

## Assumptions
1. Daily closing prices are representative of that day's market conditions.
2. Event dates are approximate "start" dates — markets may react in anticipation of, or
   with a lag after, the nominal date.
3. A single change point per model run (Task 2) is a simplification; the 35-year series
   almost certainly contains many structural breaks.
4. Log returns are treated as approximately normal for the Gaussian likelihood used in the
   Bayesian model, though real returns have fatter tails.
5. Extreme daily moves (e.g., -36% on 1991-01-17, -64% on 2020-04-21) were verified against
   external sources (EIA) and are genuine market events, not data errors.

## Limitations
1. The mandatory model captures one break at a time — see Task 2 "Advanced Extensions" for
   multiple change point / regime-switching alternatives.
2. No macroeconomic confounders (GDP, inflation, FX) are included.
3. The 16-event list is a curated, illustrative sample, not exhaustive.
4. Data ends in late 2022.

## Correlation vs. Causation
This project identifies **statistical correlation in time**, not proven causal impact.
- What the change point model shows: a date where the mean/variance of the series shifted,
  with a quantified before/after difference.
- What it does NOT show: that a specific event *caused* that shift — oil prices are driven
  by many simultaneous factors (supply, demand, speculation, unrelated macro shocks).
- A detected change point landing near a known event is a **plausible, testable hypothesis**,
  not proof. All results are phrased as "associated with" / "consistent with," never
  "caused by."