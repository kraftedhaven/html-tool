import mixpanelLib from 'mixpanel'

let mixpanel = null
const token = process.env.MIXPANEL_TOKEN || process.env.MIXPANEL_SERVER_TOKEN
if (token) {
  try {
    mixpanel = mixpanelLib.init(token, { protocol: 'https' })
  } catch {}
}

export function track(event, props = {}) {
  try {
    if (!mixpanel) return
    const safe = {}
    for (const [k, v] of Object.entries(props || {})) {
      safe[k] = typeof v === 'string' && v.length > 256 ? v.slice(0, 256) : v
    }
    mixpanel.track(event, {
      env: process.env.NODE_ENV || 'development',
      ...safe,
    })
  } catch {}
}

