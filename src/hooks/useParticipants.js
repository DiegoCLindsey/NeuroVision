import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { subscribe, peek } from '../lib/snapshotStore'

export function useParticipants(eventId) {
  const key = eventId ? `participants:${eventId}` : null
  const [state, setState] = useState(() => {
    const cached = key ? peek(key) : undefined
    return { participants: cached ?? [], loading: cached === undefined }
  })

  useEffect(() => {
    if (!key) return
    return subscribe(
      key,
      (onData) => onSnapshot(
        query(collection(db, 'events', eventId, 'participants'), orderBy('createdAt', 'asc')),
        snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      ),
      (data) => setState({ participants: data ?? [], loading: false })
    )
  }, [key])

  return state
}
