import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useArtists } from '../../hooks/useArtists'
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

  if (loading) return <Loader text="Cargando artistas..." />

  if (artists.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay artistas en la biblioteca aún.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
      {artists.map(a => (
        <div key={a.id} style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
          background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)',
        }}>
          <FlagImage code={a.country} size={20} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {a.groupName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{a.song}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => useInEvent(a)}>
            Usar en evento
          </button>
        </div>
      ))}
    </div>
  )
}
