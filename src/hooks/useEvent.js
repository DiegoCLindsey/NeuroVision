import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useEvent(eventId) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    const ref = doc(db, 'events', eventId)
    return onSnapshot(
      ref,
      snap => {
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() })
        } else {
          setEvent(null)
          setError('Evento no encontrado')
        }
        setLoading(false)
      },
      err => {
        setError(err.message)
        setLoading(false)
      }
    )
  }, [eventId])

  return { event, loading, error }
}
