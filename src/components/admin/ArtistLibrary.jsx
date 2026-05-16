import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useArtists, removeLocalArtist, invalidateArtistsCache } from '../../hooks/useArtists'
import FlagImage from '../shared/FlagImage'
import Loader from '../shared/Loader'

export default function ArtistLibrary({ eventId, onImported }) {
  const { artists, loading } = useArtists()

  async function useInEvent(artist) {
    await addDoc(collection(db, 'events', eventId, 'participants'), {
      groupName: artist.groupName,
      song: artist.song,
      country: artist.country,
      photoUrl: artist.photoUrl ?? '',
      videoUrl: artist.videoUrl ?? '',
      phases: ['qualifying'],
      createdAt: serverTimestamp(),
    })
    onImported?.()
  }

  async function handleDelete(artist) {
    if (!confirm(`¿Eliminar "${artist.groupName}" de la biblioteca?`)) return
    if (artist._local) {
      removeLocalArtist(artist.id)
    } else {
      try {
        await deleteDoc(doc(db, 'artists', artist.id))
        invalidateArtistsCache()
      } catch {
        alert('Sin permiso para borrar de la biblioteca global.')
      }
    }
  }

  if (loading) return <Loader text="Cargando artistas..." />

  if (artists.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay artistas en la biblioteca aún.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
      {artists.map(a => (
        <div key={a.id} style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
          background: 'var(--bg-secondary)', borderRadius: '8px', border: `1px solid ${a._local ? 'rgba(255,165,0,0.3)' : 'var(--border-color)'}`,
        }}>
          <FlagImage code={a.country} size={20} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {a.groupName}
              {a._local && (
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,165,0,0.2)', color: 'rgba(255,165,0,0.9)', fontWeight: 600 }}>
                  local
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{a.song}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => useInEvent(a)}>
            Usar
          </button>
          <button
            className="btn btn-danger btn-sm btn-icon"
            onClick={() => handleDelete(a)}
            title="Eliminar de biblioteca"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
