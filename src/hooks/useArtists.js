import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'

const LOCAL_KEY = 'nv_local_artists'
const CHANGED_EVENT = 'nv_artists_changed'

export function getLocalArtists() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') } catch { return [] }
}

export function saveLocalArtist(artist) {
  const list = getLocalArtists()
  const exists = list.some(a => a.id === artist.id)
  const updated = exists
    ? list.map(a => a.id === artist.id ? { ...a, ...artist } : a)
    : [...list, artist]
  localStorage.setItem(LOCAL_KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event(CHANGED_EVENT))
}

export function removeLocalArtist(id) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(getLocalArtists().filter(a => a.id !== id)))
  window.dispatchEvent(new Event(CHANGED_EVENT))
}

export function useArtists() {
  const [remote, setRemote] = useState([])
  const [local, setLocal] = useState(getLocalArtists)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'artists'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      setRemote(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = () => setLocal(getLocalArtists())
    window.addEventListener(CHANGED_EVENT, handler)
    return () => window.removeEventListener(CHANGED_EVENT, handler)
  }, [])

  const remoteIds = new Set(remote.map(a => a.id))
  const artists = [
    ...remote,
    ...local.filter(a => !remoteIds.has(a.id)).map(a => ({ ...a, _local: true })),
  ]

  return { artists, loading }
}
