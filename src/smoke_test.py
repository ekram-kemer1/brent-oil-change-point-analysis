import sys
sys.path.insert(0, '.')

from preprocessing import load_raw_prices, add_log_returns
from bayesian_model import fit_change_point_model

df = add_log_returns(load_raw_prices()).dropna(subset=['log_return'])
idata = fit_change_point_model(df['log_return'].values, draws=200, tune=200, chains=2)
print('OK, sampled', idata.posterior.dims)