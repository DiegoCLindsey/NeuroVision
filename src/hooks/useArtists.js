import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'

const LOCAL_KEY = 'nv_local_artists'
const CACHE_KEY = 'nv_artists_cache'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const CHANGED_EVENT = 'nv_artists_changed'

// ─── Local artists (localStorage) ────────────────────────────────────────────

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

// ─── Remote artists cache (localStorage, TTL) ─────────────────────────────────

function readRemoteCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data
  } catch { return null }
}

function writeRemoteCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })) } catch {}
}

export function invalidateArtistsCache() {
  localStorage.removeItem(CACHE_KEY)
  window.dispatchEvent(new Event(CHANGED_EVENT))
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useArtists() {
  const [remote, setRemote] = useState(() => readRemoteCache() ?? [])
  const [local, setLocal] = useState(getLocalArtists)
  const [loading, setLoading] = useState(() => !readRemoteCache())

  // One-time fetch (getDocs), cached for TTL — no real-time subscription needed
  useEffect(() => {
    const cached = readRemoteCache()
    if (cached) { setRemote(cached); setLoading(false); return }

    getDocs(query(collection(db, 'artists'), orderBy('createdAt', 'asc')))
      .then(snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        writeRemoteCache(data)
        setRemote(data)
      })
      .catch(() => {}) // offline / no permission → use local only
      .finally(() => setLoading(false))
  }, [])

  // Listen for local artist changes (same-tab events)
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
