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
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0)
      })
    } else {
      setTimeout(resolve, 0)
    }
  })
}
