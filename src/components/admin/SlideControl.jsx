import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import FlagImage from '../shared/FlagImage'
import ResultsSlideControl from './ResultsSlideControl'

export default function SlideControl({ event, participants, votes }) {
  const phase = event.phase
  const currentSlide = event.currentSlide
  const shuffledOrder = event.shuffledOrder ?? []

  // Participants for this phase, respecting shuffledOrder when available
  const phaseParticipants = participants.filter(p => p.phases?.includes(phase))
  const orderedParticipants = shuffledOrder.length > 0
    ? shuffledOrder.map(id => phaseParticipants.find(p => p.id === id)).filter(Boolean)
    : phaseParticipants

  async function setSlide(participantId, action = 'present', mode = 'presentation') {
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: { participantId, action, mode, bannerVisible: true },
    })
  }

  async function setMode(newMode) {
    if (!currentSlide) return
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: { ...currentSlide, mode: newMode },
    })
  }

  async function openVoting() {
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: { action: 'vote', votingOpen: true },
    })
  }

  async function closeVoting() {
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: { action: 'waiting', votingOpen: false },
    })
  }

  async function showResults() {
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: { action: 'results', bannerVisible: true },
    })
  }

  async function nextPerformance() {
    const currentIdx = orderedParticipants.findIndex(p => p.id === currentSlide?.participantId)
    const next = orderedParticipants[currentIdx + 1]
    if (next) {
      await setSlide(next.id, 'present', 'presentation')
    }
  }

  async function prevPerformance() {
    const currentIdx = orderedParticipants.findIndex(p => p.id === currentSlide?.participantId)
    const prev = orderedParticipants[currentIdx - 1]
    if (prev) {
      await setSlide(prev.id, 'present', currentSlide?.mode ?? 'presentation')
    }
  }

  async function toggleBanner() {
    await updateDoc(doc(db, 'events', event.id), {
      'currentSlide.bannerVisible': !currentSlide?.bannerVisible,
    })
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

  const isVote = currentSlide?.action === 'vote'
  const isWaiting = currentSlide?.action === 'waiting'
  const isResults = currentSlide?.action === 'results'
  const currentParticipant = orderedParticipants.find(p => p.id === currentSlide?.participantId)
  const currentIdx = orderedParticipants.findIndex(p => p.id === currentSlide?.participantId)
  const isLastParticipant = currentIdx === orderedParticipants.length - 1
  const allPerformed = isVote || isResults || (currentIdx >= 0 && isLastParticipant)
  const currentMode = currentSlide?.mode ?? 'presentation'

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Control de slides</h3>

      {!isVote && !isResults && (
        <>
          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button
              className="btn btn-secondary"
              onClick={prevPerformance}
              disabled={!currentSlide?.participantId || currentIdx <= 0}
            >◀</button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              {currentParticipant ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <FlagImage code={currentParticipant.country} size={18} /> {currentParticipant.groupName}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{currentParticipant.song}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                    {currentIdx + 1} / {orderedParticipants.length}
                  </div>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Ninguno seleccionado</span>
              )}
            </div>
            <button
              className="btn btn-secondary"
              onClick={nextPerformance}
              disabled={!currentSlide?.participantId || isLastParticipant}
            >▶</button>
          </div>

          {/* Presentation / Performance mode buttons */}
          {currentParticipant && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${currentMode === 'presentation' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode('presentation')}
              >
                🎭 Presentación
              </button>
              <button
                className={`btn btn-sm ${currentMode === 'performance' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode('performance')}
              >
                ▶️ Actuación
              </button>
            </div>
          )}

          {/* Next performance button */}
          {currentSlide?.participantId && !isLastParticipant && (
            <div style={{ marginBottom: '12px' }}>
              <button className="btn btn-accent" onClick={nextPerformance}>
                Siguiente actuación →
              </button>
            </div>
          )}

          {/* Open voting button — always available once a phase is running */}
          <div style={{ marginBottom: '12px' }}>
            <button className="btn btn-primary" onClick={openVoting}>
              🗳️ Abrir votaciones
            </button>
          </div>

          <div className="divider" style={{ margin: '12px 0' }} />
          <p className="label" style={{ marginBottom: '8px' }}>Ir directamente a:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {orderedParticipants.map((p, i) => (
              <button
                key={p.id}
                className={`btn btn-sm ${currentSlide?.participantId === p.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSlide(p.id, 'present', currentMode)}
              >
                {i + 1}. {p.groupName}
              </button>
            ))}
          </div>
        </>
      )}

      {isVote && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(100,149,237,0.15)', border: '1px solid rgba(100,149,237,0.4)', fontSize: '14px', marginBottom: '12px' }}>
            🗳️ Votaciones abiertas — los espectadores pueden votar ahora.
          </div>
          <button className="btn btn-danger" onClick={closeVoting}>
            🔒 Cerrar votaciones
          </button>
        </div>
      )}

      {isWaiting && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,165,0,0.15)', border: '1px solid rgba(255,165,0,0.4)', fontSize: '14px', marginBottom: '12px' }}>
            🔒 Votaciones cerradas — espectadores en sala de espera.
          </div>
          <button className="btn btn-accent" onClick={showResults}>
            📊 Presentar resultados
          </button>
        </div>
      )}

      <div style={{ marginTop: '16px' }}>
        <ResultsSlideControl event={event} participants={participants} votes={votes} />
      </div>
    </div>
  )
}
