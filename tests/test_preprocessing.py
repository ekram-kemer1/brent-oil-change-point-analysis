import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from preprocessing import load_raw_prices, add_log_returns, load_events


def test_load_raw_prices_parses_dates_and_sorts():
    df = load_raw_prices()
    assert df["Date"].is_monotonic_increasing
    assert df["Price"].dtype.kind == "f"
    assert len(df) > 9000


def test_add_log_returns_creates_expected_columns():
    df = load_raw_prices()
    df = add_log_returns(df)
    assert "log_price" in df.columns
    assert "log_return" in df.columns


def test_load_events_has_minimum_required_events():
    events = load_events()
    assert len(events) >= 10