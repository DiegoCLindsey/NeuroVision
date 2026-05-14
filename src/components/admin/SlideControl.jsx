import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { countryFlag } from '../../utils/scoring'

const ACTIONS = [
  { id: 'present', label: '🎤 Presentar', desc: 'Muestra la info del participante' },
  { id: 'vote', label: '🗳️ Votar', desc: 'Los espectadores pueden votar' },
  { id: 'results', label: '📊 Resultados', desc: 'Muestra resultados de la fase' },
]

export default function SlideControl({ event, participants }) {
  const phase = event.phase
  const currentSlide = event.currentSlide
  const phaseParticipants = participants.filter(p => p.phases?.includes(phase))

  async function setSlide(participantId, action = 'present') {
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: { participantId, action },
    })
  }

  async function setAction(action) {
    if (!currentSlide) return
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: { ...currentSlide, action },
    })
  }

  async function prevSlide() {
    const idx = phaseParticipants.findIndex(p => p.id === currentSlide?.participantId)
    const prev = phaseParticipants[(idx - 1 + phaseParticipants.length) % phaseParticipants.length]
    if (prev) setSlide(prev.id)
  }

  async function nextSlide() {
    const idx = phaseParticipants.findIndex(p => p.id === currentSlide?.participantId)
    const next = phaseParticipants[(idx + 1) % phaseParticipants.length]
    if (next) setSlide(next.id)
  }

  if (phase === 'lobby' || phase === 'done') {
    return (
      <div className="card">
        <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Control de slides</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {phase === 'lobby' ? 'Avanza a la fase clasificatoria para controlar los slides.' : 'El evento ha finalizado.'}
        </p>
      </div>
    )
  }

  const currentParticipant = phaseParticipants.find(p => p.id === currentSlide?.participantId)
  const currentIdx = phaseParticipants.findIndex(p => p.id === currentSlide?.participantId)

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Control de slides</h3>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button className="btn btn-secondary" onClick={prevSlide} disabled={!currentSlide || phaseParticipants.length < 2}>◀</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {currentParticipant ? (
            <>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>
                {countryFlag(currentParticipant.country)} {currentParticipant.groupName}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{currentParticipant.song}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                {currentIdx + 1} / {phaseParticipants.length}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Ninguno seleccionado</span>
          )}
        </div>
        <button className="btn btn-secondary" onClick={nextSlide} disabled={!currentSlide || phaseParticipants.length < 2}>▶</button>
      </div>

      {/* Action selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {ACTIONS.map(a => (
          <button
            key={a.id}
            className={`btn ${currentSlide?.action === a.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAction(a.id)}
            disabled={!currentSlide}
            title={a.desc}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Participant list */}
      <div style={{ marginTop: '16px' }}>
        <div className="divider" style={{ margin: '0 0 12px' }} />
        <p className="label" style={{ marginBottom: '8px' }}>Ir directamente a:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {phaseParticipants.map((p, i) => (
            <button
              key={p.id}
              className={`btn btn-sm ${currentSlide?.participantId === p.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSlide(p.id, currentSlide?.action ?? 'present')}
            >
              {i + 1}. {countryFlag(p.country)} {p.groupName}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
