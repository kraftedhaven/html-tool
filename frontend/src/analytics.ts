import mixpanel from 'mixpanel-browser'

const token = import.meta.env.VITE_MIXPANEL_TOKEN

export function initAnalytics() {
  try {
    if (!token) return
    mixpanel.init(token, { debug: false, track_pageview: false })
    mixpanel.register({ env: import.meta.env.MODE })
    mixpanel.track('App Loaded', {
      source: 'frontend',
      userAgent: navigator.userAgent,
    })
    // Basic SPA page view tracking
    const trackPage = () => mixpanel.track('Page Viewed', { path: location.pathname + location.hash })
    window.addEventListener('popstate', trackPage)
    window.addEventListener('hashchange', trackPage)
    // First view
    trackPage()
    // Expose a safe global helper
    ;(window as any).trackEvent = (name: string, props?: Record<string, any>) => {
      try { mixpanel.track(name, { source: 'frontend', ...(props || {}) }) } catch {}
    }
  } catch {}
}

