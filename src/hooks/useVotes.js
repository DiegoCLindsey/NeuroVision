import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { subscribe, peek } from '../lib/snapshotStore'

// enabled=false → no subscription opened (use on pages where votes aren't always needed)
export function useVotes(eventId, { enabled = true } = {}) {
  const key = eventId && enabled ? `votes:${eventId}` : null
  const [state, setState] = useState(() => {
    const cached = key ? peek(key) : undefined
    return { votes: cached ?? [], loading: enabled && cached === undefined }
  })

  useEffect(() => {
    if (!key) {
      setState({ votes: [], loading: false })
      return
    }
    return subscribe(
      key,
      (onData) => onSnapshot(
        collection(db, 'events', eventId, 'votes'),
        snap => onData(snap.docs.map(d => ({ userId: d.id, ...d.data() })))
      ),
      (data) => setState({ votes: data ?? [], loading: false })
    )
  }, [key])

  return state
}
