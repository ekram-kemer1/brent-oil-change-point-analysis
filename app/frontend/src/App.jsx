import React, { useEffect, useMemo, useState } from 'react'
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
} from 'recharts'
import { api } from './api'

const CATEGORY_COLOR = {
    Conflict: 'var(--rust)',
    'Economic Shock': 'var(--shock)',
    'OPEC Policy': 'var(--amber)',
    Sanctions: 'var(--sanction)',
    Geopolitical: 'var(--sanction)',
}

const RANGE_PRESETS = [
    { label: 'ALL', start: null, end: null },
    { label: '2008-2010', start: '2008-01-01', end: '2010-12-31' },
    { label: '2014-2016', start: '2014-01-01', end: '2016-12-31' },
    { label: '2020-2022', start: '2020-01-01', end: '2022-12-31' },
]

function formatUSD(v) {
    return `$${Number(v).toFixed(2)}`
}

function ChartTooltip({ active, payload, label, eventsByDate }) {
    if (!active || !payload || !payload.length) return null
    const event = eventsByDate[label]
    return (
        <div className="chart-tooltip">
            <div className="tt-date">{label}</div>
            <div>{formatUSD(payload[0].value)} / barrel</div>
            {event && (
                <div className="tt-event">
                    <strong style={{ color: 'var(--amber-bright)' }}>{event.event_name}</strong>
                    <br />
                    {event.description}
                </div>
            )}
        </div>
    )
}

export default function App() {
    const [summary, setSummary] = useState(null)
    const [prices, setPrices] = useState([])
    const [events, setEvents] = useState([])
    const [changepoints, setChangepoints] = useState(null)
    const [range, setRange] = useState(RANGE_PRESETS[0])
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [categoryFilter, setCategoryFilter] = useState('All')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        Promise.all([api.summary(), api.events(), api.changepoints()])
            .then(([s, e, cp]) => {
                setSummary(s)
                setEvents(e)
                setChangepoints(cp)
            })
            .catch((err) => setError(err.message))
    }, [])

    useEffect(() => {
        setLoading(true)
        api
            .prices(range.start, range.end)
            .then((p) => setPrices(p))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [range])

    const eventsByDate = useMemo(() => {
        const map = {}
        events.forEach((e) => {
            map[e.start_date] = e
        })
        return map
    }, [events])

    const visibleEvents = useMemo(() => {
        let list = events
        if (categoryFilter !== 'All') list = list.filter((e) => e.category === categoryFilter)
        if (range.start) list = list.filter((e) => e.start_date >= range.start)
        if (range.end) list = list.filter((e) => e.start_date <= range.end)
        return list
    }, [events, categoryFilter, range])

    const categories = useMemo(
        () => ['All', ...Array.from(new Set(events.map((e) => e.category)))],
        [events]
    )

    const chartData = useMemo(
        () =>
            prices.filter((_, i) => {
                const step = prices.length > 1500 ? Math.ceil(prices.length / 1500) : 1
                return i % step === 0
            }),
        [prices]
    )

    return (
        <div>
            <div className="ticker-bar">
                <div className="ticker-track">
                    {[...events, ...events].map((e, i) => (
                        <span className="ticker-item" key={`${e.event_id}-${i}`}>
                            <span className="tdate">{e.start_date}</span>
                            <span className="tname">{e.event_name}</span>
                        </span>
                    ))}
                </div>
            </div>

            <div className="page">
                <header className="hero">
                    <p className="eyebrow">Birhan Energies — Market Intelligence</p>
                    <h1>
                        Reading the <em>shocks</em> in four decades of Brent crude.
                    </h1>
                    <p>
                        A Bayesian change point analysis of daily Brent oil prices (1987-2022), cross-referenced
                        against 16 researched geopolitical, OPEC-policy, and macroeconomic events.
                    </p>
                </header>

                {error && (
                    <p style={{ color: 'var(--rust)' }}>
                        Could not reach the API: {error}. Is the Flask backend running on port 5000?
                    </p>
                )}

                {summary && (
                    <div className="stat-row">
                        <div className="stat-card">
                            <p className="stat-label">Date range</p>
                            <p className="stat-value" style={{ fontSize: 16 }}>
                                {summary.date_range.start} → {summary.date_range.end}
                            </p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-label">Observations</p>
                            <p className="stat-value">{summary.total_observations.toLocaleString()}</p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-label">Price range</p>
                            <p className="stat-value">
                                {formatUSD(summary.min_price)}-{formatUSD(summary.max_price)}
                            </p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-label">Mean price</p>
                            <p className="stat-value">{formatUSD(summary.mean_price)}</p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-label">Events tracked</p>
                            <p className="stat-value">{summary.num_events_tracked}</p>
                        </div>
                    </div>
                )}

                <section>
                    <div className="section-head">
                        <h2>Price history with event highlights</h2>
                        <div className="controls">
                            <label>Range</label>
                            {RANGE_PRESETS.map((p) => (
                                <button
                                    key={p.label}
                                    className={range.label === p.label ? 'active' : ''}
                                    onClick={() => setRange(p)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="panel">
                        {loading ? (
                            <p style={{ color: 'var(--ink-dim)', padding: '40px 0' }}>Loading price series...</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={420}>
                                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                    <CartesianGrid stroke="var(--line)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: 'var(--ink-dim)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                                        minTickGap={60}
                                    />
                                    <YAxis
                                        tick={{ fill: 'var(--ink-dim)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                                        tickFormatter={(v) => `$${v}`}
                                        width={54}
                                    />
                                    <Tooltip content={<ChartTooltip eventsByDate={eventsByDate} />} />
                                    {visibleEvents.map((e) => (
                                        <ReferenceLine
                                            key={e.event_id}
                                            x={e.start_date}
                                            stroke={CATEGORY_COLOR[e.category] || 'var(--ink-dim)'}
                                            strokeDasharray="3 3"
                                            strokeOpacity={selectedEvent && selectedEvent.event_id !== e.event_id ? 0.15 : 0.55}
                                        />
                                    ))}
                                    <Line
                                        type="monotone"
                                        dataKey="price"
                                        stroke="var(--amber-bright)"
                                        strokeWidth={1.4}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                        <div className="legend">
                            {Object.entries(CATEGORY_COLOR).map(([cat, color]) => (
                                <span className="legend-item" key={cat}>
                                    <span className="dot" style={{ background: color }} />
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {changepoints && (
                    <section>
                        <div className="section-head">
                            <h2>Detected change points</h2>
                            <span className="section-sub">Bayesian single change point model (PyMC)</span>
                        </div>
                        <div className="cp-grid">
                            {changepoints.price_model && (
                                <ChangePointCard title="Price level model" cp={changepoints.price_model} type="price" />
                            )}
                            {changepoints.return_model && (
                                <ChangePointCard title="Log return model" cp={changepoints.return_model} type="return" />
                            )}
                        </div>
                    </section>
                )}

                <section>
                    <div className="section-head">
                        <h2>Event archive</h2>
                        <div className="controls">
                            <label>Category</label>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="event-list">
                        {visibleEvents.map((e) => (
                            <div
                                key={e.event_id}
                                className={`event-row${selectedEvent?.event_id === e.event_id ? ' selected' : ''}`}
                                onClick={() => setSelectedEvent(selectedEvent?.event_id === e.event_id ? null : e)}
                                tabIndex={0}
                                role="button"
                            >
                                <span className="event-date">{e.start_date}</span>
                                <span
                                    className="event-cat"
                                    style={{
                                        color: CATEGORY_COLOR[e.category] || 'var(--ink-dim)',
                                        border: `1px solid ${CATEGORY_COLOR[e.category] || 'var(--line)'}`,
                                    }}
                                >
                                    {e.category}
                                </span>
                                <div>
                                    <p className="event-name">{e.event_name}</p>
                                    <p className="event-desc">{e.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="footer">
                    Birhan Energies · Brent Crude Change Point Analysis · Data: daily Brent prices,
                    20-May-1987 to 30-Sep-2022 · Statistical association is not proof of causation.
                </footer>
            </div>
        </div>
    )
}

function ChangePointCard({ title, cp, type }) {
    if (!cp) return null
    return (
        <div className="cp-card">
            <p className="cp-title">{title}</p>
            <p className="cp-date">{cp.tau_date}</p>
            {type === 'price' && (
                <>
                    <div className="cp-row">
                        <span className="k">Mean price before</span>
                        <span>{formatUSD(cp.mu_1)}</span>
                    </div>
                    <div className="cp-row">
                        <span className="k">Mean price after</span>
                        <span>{formatUSD(cp.mu_2)}</span>
                    </div>
                    <div className="cp-row">
                        <span className="k">Change</span>
                        <span style={{ color: cp.pct_change > 0 ? 'var(--teal)' : 'var(--rust)' }}>
                            {cp.pct_change > 0 ? '+' : ''}
                            {cp.pct_change}%
                        </span>
                    </div>
                </>
            )}
            {type === 'return' && (
                <div className="cp-row">
                    <span className="k">Nearest event</span>
                    <span>{cp.nearest_event} ({cp.days_from_event}d)</span>
                </div>
            )}
            {cp.note && <div className="cp-note">{cp.note}</div>}
        </div>
    )
}