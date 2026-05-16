import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { subscribe, peek } from '../lib/snapshotStore'

export function useEvent(eventId) {
  const key = eventId ? `event:${eventId}` : null
  const [state, setState] = useState(() => {
    const cached = key ? peek(key) : undefined
    return { event: cached ?? null, loading: cached === undefined, error: null }
  })

  useEffect(() => {
    if (!key) return
    return subscribe(
      key,
      (onData, onError) => onSnapshot(
        doc(db, 'events', eventId),
        snap => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
        err => onError(err)
      ),
      (data, err) => setState({
        event: data ?? null,
        loading: false,
        error: err ? err.message : (data === null ? 'Evento no encontrado' : null),
      })
    )
  }, [key])

  return state
}
