import axios from 'axios'

const SITE_ID = process.env.CUSTOMERIO_SITE_ID
const API_KEY = process.env.CUSTOMERIO_API_KEY
const BASE = 'https://track.customer.io/api/v1'

function hasCreds() {
  return !!(SITE_ID && API_KEY)
}

function authHeaders() {
  const token = Buffer.from(`${SITE_ID}:${API_KEY}`).toString('base64')
  return { Authorization: `Basic ${token}` }
}

export async function cioIdentify(id, traits = {}) {
  try {
    if (!hasCreds()) return
    await axios.put(`${BASE}/customers/${encodeURIComponent(id)}`, traits, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      timeout: 5000,
    })
  } catch {}
}

export async function cioTrack(id, name, data = {}) {
  try {
    if (!hasCreds()) return
    await axios.post(
      `${BASE}/customers/${encodeURIComponent(id)}/events`,
      { name, data },
      { headers: { ...authHeaders(), 'Content-Type': 'application/json' }, timeout: 5000 }
    )
  } catch {}
}

export function resolveUserId(req) {
  return (
    (req.user && (req.user.username || req.user.id)) ||
    req.body?.username ||
    req.headers['x-user-id'] ||
    'anonymous'
  )
}

