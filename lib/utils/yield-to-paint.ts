/**
 * Yields execution to the browser's paint pipeline so user interactions
 * (pointer clicks, active button CSS states, focus rings) paint in < 16ms
 * before any heavy React state transitions or component mounts run.
 *
 * Conforms to Google Chrome Core Web Vitals standards for sub-16ms INP
 * (Interaction to Next Paint).
 */
export function yieldToPaint(): Promise<void> {
  if (
    typeof window !== 'undefined' &&
    'scheduler' in window &&
    typeof (window as any).scheduler?.yield === 'function'
  ) {
    return (window as any).scheduler.yield()
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (!settled) {
        settled = true
        resolve()
      }
    }
    // requestAnimationFrame never fires while the window is hidden/occluded,
    // so a plain rAF wait would hang the deferred action forever. Cap the
    // paint yield — visible windows still settle on the next frame (<16ms).
    const timer = setTimeout(finish, 50)
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        clearTimeout(timer)
        finish()
      })
    } else {
      clearTimeout(timer)
      setTimeout(finish, 0)
    }
  })
}
