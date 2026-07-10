"""
Data loading, cleaning, and preprocessing utilities for the Brent oil price dataset.

The raw CSV mixes two date formats over its history:
    - "20-May-87"      (day-Mon-yy)   for earlier rows
    - "Nov 08, 2022"   (Mon dd, yyyy) for later rows
This module normalizes both into a single datetime column.
"""
from pathlib import Path

import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DATA_PATH = PROJECT_ROOT / "data" / "raw" / "BrentOilPrices.csv"
EXTERNAL_EVENTS_PATH = PROJECT_ROOT / "data" / "external" / "key_events.csv"
PROCESSED_DATA_PATH = PROJECT_ROOT / "data" / "processed" / "brent_prices_clean.csv"


def load_raw_prices(path: str | Path = RAW_DATA_PATH) -> pd.DataFrame:
    """Load the raw Brent oil price CSV with the Date column parsed correctly."""
    df = pd.read_csv(path)

    def _parse_date(value: str) -> pd.Timestamp:
        for fmt in ("%d-%b-%y", "%b %d, %Y"):
            try:
                return pd.to_datetime(value, format=fmt)
            except ValueError:
                continue
        return pd.to_datetime(value)

    df["Date"] = df["Date"].apply(_parse_date)
    df = df.sort_values("Date").reset_index(drop=True)
    df["Price"] = df["Price"].astype(float)
    return df


def add_log_returns(df: pd.DataFrame, price_col: str = "Price") -> pd.DataFrame:
    """Add log price and log return columns to the dataframe."""
    df = df.copy()
    df["log_price"] = np.log(df[price_col])
    df["log_return"] = df["log_price"].diff()
    return df


def load_events(path: str | Path = EXTERNAL_EVENTS_PATH) -> pd.DataFrame:
    """Load the structured key-events dataset from data/external/."""
    events = pd.read_csv(path, parse_dates=["start_date"])
    return events.sort_values("start_date").reset_index(drop=True)


def save_processed_data(df: pd.DataFrame, path: str | Path = PROCESSED_DATA_PATH) -> None:
    """Save the cleaned dataframe to data/processed/."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    print(f"Saved processed data to {path}")


if __name__ == "__main__":
    prices = load_raw_prices()
    prices = add_log_returns(prices)
    print(prices.head())
    print(prices.tail())
    print(f"\nRows: {len(prices)}, Date range: {prices['Date'].min()} to {prices['Date'].max()}")
    save_processed_data(prices)