import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useVotes(eventId) {
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return
    return onSnapshot(
      collection(db, 'events', eventId, 'votes'),
      snap => {
        setVotes(snap.docs.map(d => ({ userId: d.id, ...d.data() })))
        setLoading(false)
      }
    )
  }, [eventId])

  return { votes, loading }
}
