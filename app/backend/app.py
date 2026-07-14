"""
Flask API serving Brent oil price data, researched events, and change point model results.
"""
import json
import sys
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from preprocessing import load_raw_prices, load_events

app = Flask(__name__)
CORS(app)

REPORTS_DIR = ROOT / "reports"

_prices_df = load_raw_prices()
_events_df = load_events()


def _load_json(filename):
    path = REPORTS_DIR / filename
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/prices")
def prices():
    start = request.args.get("start")
    end = request.args.get("end")
    df = _prices_df
    if start:
        df = df[df["Date"] >= start]
    if end:
        df = df[df["Date"] <= end]
    return jsonify([
        {"date": d.strftime("%Y-%m-%d"), "price": p}
        for d, p in zip(df["Date"], df["Price"])
    ])


@app.route("/api/events")
def events():
    records = json.loads(_events_df.to_json(orient="records", date_format="iso"))
    for r in records:
        if r.get("start_date"):
            r["start_date"] = r["start_date"][:10]
    return jsonify(records)


@app.route("/api/changepoints")
def changepoints():
    data = _load_json("change_point_results.json")
    if data is None:
        return jsonify({"error": "run the Task 2 notebook first to generate reports/change_point_results.json"}), 404
    return jsonify(data)


@app.route("/api/summary")
def summary():
    return jsonify({
        "total_observations": len(_prices_df),
        "date_range": {
            "start": _prices_df["Date"].min().strftime("%Y-%m-%d"),
            "end": _prices_df["Date"].max().strftime("%Y-%m-%d"),
        },
        "min_price": float(_prices_df["Price"].min()),
        "max_price": float(_prices_df["Price"].max()),
        "mean_price": round(float(_prices_df["Price"].mean()), 2),
        "num_events_tracked": len(_events_df),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)