const BASE = '/api'

async function get(path) {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) throw new Error(`Request failed: ${path} (${res.status})`)
    return res.json()
}

export const api = {
    health: () => get('/health'),
    prices: (start, end) => {
        const params = new URLSearchParams()
        if (start) params.set('start', start)
        if (end) params.set('end', end)
        const qs = params.toString()
        return get(`/prices${qs ? `?${qs}` : ''}`)
    },
    events: () => get('/events'),
    changepoints: () => get('/changepoints'),
    summary: () => get('/summary'),
}