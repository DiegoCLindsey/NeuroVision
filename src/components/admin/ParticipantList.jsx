import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { countryFlag } from '../../utils/scoring'

export default function ParticipantList({ eventId, participants }) {
  async function handleDelete(pid) {
    if (!confirm('¿Eliminar este participante?')) return
    await deleteDoc(doc(db, 'events', eventId, 'participants', pid))
  }

  if (participants.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎤</div>
        <p>No hay participantes aún. ¡Añade el primero!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {participants.map((p, i) => (
        <div key={p.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 700, minWidth: '24px', fontSize: '13px' }}>{i + 1}</span>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>
            {p.photoUrl
              ? <img src={p.photoUrl} alt={p.groupName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : countryFlag(p.country)
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {countryFlag(p.country)} {p.groupName}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              {p.song}
              {p.videoUrl && <span style={{ marginLeft: '8px', color: 'var(--color-primary)', fontSize: '11px' }}>▶ video</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {p.phases?.map(ph => (
              <span key={ph} className={`badge badge-${ph}`}>{ph}</span>
            ))}
            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)} title="Eliminar">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
