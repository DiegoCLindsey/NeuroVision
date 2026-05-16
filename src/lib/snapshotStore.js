// Module-level singleton store for Firestore onSnapshot subscriptions.
// Multiple hook instances with the same key share one active listener.
// The listener is cleaned up only when the last consumer unmounts.

const store = new Map()
// key → { data, error, listeners: Set<fn>, unsub: () => void }

export function subscribe(key, openSnapshot, onUpdate) {
  if (!store.has(key)) {
    const entry = { data: undefined, error: null, listeners: new Set() }
    store.set(key, entry)
    entry.unsub = openSnapshot(
      (data) => {
        entry.data = data
        entry.error = null
        entry.listeners.forEach(fn => fn(data, null))
      },
      (err) => {
        entry.error = err
        entry.listeners.forEach(fn => fn(entry.data, err))
      }
    )
  }

  const entry = store.get(key)
  entry.listeners.add(onUpdate)

  // Emit cached data immediately if available
  if (entry.data !== undefined) onUpdate(entry.data, entry.error)

  return () => {
    entry.listeners.delete(onUpdate)
    if (entry.listeners.size === 0) {
      entry.unsub?.()
      store.delete(key)
    }
  }
}

export function peek(key) {
  return store.get(key)?.data
}
