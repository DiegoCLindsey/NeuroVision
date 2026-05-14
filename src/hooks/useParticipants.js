import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useParticipants(eventId) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return
    const q = query(
      collection(db, 'events', eventId, 'participants'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, snap => {
      setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [eventId])

  return { participants, loading }
}
