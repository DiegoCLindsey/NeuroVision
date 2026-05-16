import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { PHASE_LABELS, getActivePhaseOrder } from '../../utils/scoring'
import FlagImage from '../shared/FlagImage'
import ResultsSlideControl from './ResultsSlideControl'

export default function RemoteControl({ event, participants, votes }) {
  const phase = event.phase
  const currentSlide = event.currentSlide
  const shuffledOrder = event.shuffledOrder ?? []
  const activeOrder = getActivePhaseOrder(event.config?.enabledPhases)

  const phaseParticipants = participants.filter(p => p.phases?.includes(phase))
  const ordered = shuffledOrder.length > 0
    ? shuffledOrder.map(id => phaseParticipants.find(p => p.id === id)).filter(Boolean)
    : phaseParticipants

  const currentIdx = ordered.findIndex(p => p.id === currentSlide?.participantId)
  const currentParticipant = ordered[currentIdx] ?? null
  const isFirst = currentIdx <= 0
  const isLast = currentIdx === ordered.length - 1
  const action = currentSlide?.action
  const isVoting = action === 'vote'
  const isWaiting = action === 'waiting'
  const isResults = action === 'results'
  const currentMode = currentSlide?.mode ?? 'presentation'

  async function setSlide(participantId) {
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: { participantId, action: 'present', mode: 'presentation', bannerVisible: true },
    })
  }

  async function setMode(newMode) {
    if (!currentSlide?.participantId) return
    await updateDoc(doc(db, 'events', event.id), { 'currentSlide.mode': newMode })
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

  async function toggleBanner() {
    await updateDoc(doc(db, 'events', event.id), {
      'currentSlide.bannerVisible': !currentSlide?.bannerVisible,
    })
  }

  if (phase === 'lobby' || phase === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>
          {phase === 'lobby' ? '⏳' : '🏆'}
        </div>
        <p style={{ fontSize: '14px' }}>
          {phase === 'lobby' ? 'Avanza la fase para usar el mando.' : 'El evento ha finalizado.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '420px', margin: '0 auto' }}>

      {/* Current participant display */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '16px 16px 0 0', padding: '20px', textAlign: 'center',
      }}>
        {currentParticipant ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <FlagImage code={currentParticipant.country} size={36} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '20px', marginBottom: '4px' }}>
              {currentParticipant.groupName}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic', marginBottom: '8px' }}>
              "{currentParticipant.song}"
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {currentIdx + 1} / {ordered.length} · {PHASE_LABELS[phase]}
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            {isVoting ? '🗳️ Votaciones abiertas' : isWaiting ? '🔒 Votaciones cerradas' : isResults ? '📊 Resultados' : 'Sin selección'}
          </div>
        )}
      </div>

      {/* Nav arrows */}
      {!isVoting && !isResults && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          <button
            className="btn btn-secondary"
            style={{ borderRadius: 0, padding: '20px', fontSize: '28px', fontWeight: 900 }}
            onClick={() => { const p = ordered[currentIdx - 1]; if (p) setSlide(p.id) }}
            disabled={!currentParticipant || isFirst}
          >◀</button>
          <button
            className="btn btn-secondary"
            style={{ borderRadius: 0, padding: '20px', fontSize: '28px', fontWeight: 900 }}
            onClick={() => { const p = ordered[currentIdx + 1]; if (p) setSlide(p.id) }}
            disabled={!currentParticipant || isLast}
          >▶</button>
        </div>
      )}

      {/* Mode toggle — only during presentation */}
      {currentParticipant && !isVoting && !isResults && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          <button
            className={`btn ${currentMode === 'presentation' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 0, padding: '14px', fontSize: '14px' }}
            onClick={() => setMode('presentation')}
          >🎭 Presentación</button>
          <button
            className={`btn ${currentMode === 'performance' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 0, padding: '14px', fontSize: '14px' }}
            onClick={() => setMode('performance')}
          >▶️ Actuación</button>
        </div>
      )}

      {/* Voting / results controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {!isVoting && !isWaiting && !isResults && (
          <button
            className="btn btn-primary"
            style={{ borderRadius: 0, padding: '18px', fontSize: '16px', fontWeight: 700 }}
            onClick={openVoting}
          >🗳️ Abrir votaciones</button>
        )}
        {isVoting && (
          <button
            className="btn btn-danger"
            style={{ borderRadius: 0, padding: '18px', fontSize: '16px', fontWeight: 700 }}
            onClick={closeVoting}
          >🔒 Cerrar votaciones</button>
        )}
        {isWaiting && (
          <button
            className="btn btn-accent"
            style={{ borderRadius: 0, padding: '18px', fontSize: '16px', fontWeight: 700 }}
            onClick={showResults}
          >📊 Mostrar resultados</button>
        )}
      </div>

      {/* Results controls */}
      {isResults && (
        <div style={{ marginTop: '16px' }}>
          <ResultsSlideControl event={event} participants={participants} votes={votes} />
        </div>
      )}

      {/* Banner toggle */}
      {currentParticipant && !isVoting && !isResults && (
        <button
          className={`btn ${currentSlide?.bannerVisible ? 'btn-secondary' : 'btn-secondary'}`}
          style={{
            borderRadius: '0 0 16px 16px', padding: '14px', fontSize: '13px',
            opacity: currentSlide?.bannerVisible ? 1 : 0.5,
          }}
          onClick={toggleBanner}
        >
          {currentSlide?.bannerVisible ? '🏷️ Ocultar banner' : '🏷️ Mostrar banner'}
        </button>
      )}

      {/* Quick jump */}
      {!isVoting && !isResults && ordered.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ir a
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ordered.map((p, i) => (
              <button
                key={p.id}
                className={`btn btn-sm ${currentParticipant?.id === p.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: '44px' }}
                onClick={() => setSlide(p.id)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
