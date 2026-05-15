import { doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { nextPhase, topParticipants, computeScores, PHASE_LABELS, PHASE_ORDER } from '../../utils/scoring'

// Simplified phase sequence for navigation
const SIMPLE_PHASES = ['lobby', 'semifinal', 'final', 'done']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PhaseControl({ event, participants, votes }) {
  const phase = event.phase
  const isLast = phase === 'done'

  // Find prev phase in PHASE_ORDER
  const phaseIdx = PHASE_ORDER.indexOf(phase)
  const prevPhaseVal = phaseIdx > 0 ? PHASE_ORDER[phaseIdx - 1] : null

  async function advance() {
    const next = nextPhase(phase)
    if (next === 'done') {
      if (!confirm('¿Finalizar el evento?')) return
      await updateDoc(doc(db, 'events', event.id), { phase: 'done', currentSlide: null })
      return
    }

    const batch = writeBatch(db)

    // Determine participants for the next phase
    let nextPhaseParticipants = []
    if (phase === 'lobby') {
      // Everyone goes to qualifying
      nextPhaseParticipants = participants.map(p => p.id)
    } else if (phase === 'qualifying') {
      const qualifyingTop = event.config?.qualifyingTop ?? event.config?.qualifyTop ?? 10
      const scores = computeScores(votes, 'qualifying', participants.map(p => p.id))
      const top = topParticipants(scores, qualifyingTop)
      nextPhaseParticipants = top.slice(0, Math.ceil(top.length / 2))
    } else if (phase === 'semifinal') {
      const inSemi = participants.filter(p => p.phases?.includes('semifinal')).map(p => p.id)
      const scores = computeScores(votes, 'semifinal', inSemi)
      const semifinalTop = event.config?.semifinalTop ?? Math.ceil(inSemi.length / 2)
      nextPhaseParticipants = topParticipants(scores, semifinalTop)
    } else if (phase === 'semi1') {
      const inSemi1 = participants.filter(p => p.phases?.includes('semi1')).map(p => p.id)
      const scores = computeScores(votes, 'semi1', inSemi1)
      const semi1Top = event.config?.semi1Top ?? Math.ceil(inSemi1.length / 2)
      nextPhaseParticipants = topParticipants(scores, semi1Top)
      const qualifyingTop = event.config?.qualifyingTop ?? event.config?.qualifyTop ?? 10
      const qualScores = computeScores(votes, 'qualifying', participants.map(p => p.id))
      const allTop = topParticipants(qualScores, qualifyingTop)
      const semi2Participants = allTop.slice(Math.ceil(allTop.length / 2))
      for (const pid of semi2Participants) {
        const p = participants.find(p => p.id === pid)
        if (p && !p.phases?.includes('semi2')) {
          batch.update(doc(db, 'events', event.id, 'participants', pid), {
            phases: [...(p.phases ?? []), 'semi2'],
          })
        }
      }
    } else if (phase === 'semi2') {
      const inSemi2 = participants.filter(p => p.phases?.includes('semi2')).map(p => p.id)
      const scores = computeScores(votes, 'semi2', inSemi2)
      const semi2Top = event.config?.semi2Top ?? Math.ceil(inSemi2.length / 2)
      const semi2Winners = topParticipants(scores, semi2Top)
      const semi1Winners = participants.filter(p => p.phases?.includes('semi1') && p.phases?.includes('final')).map(p => p.id)
      nextPhaseParticipants = [...new Set([...semi1Winners, ...semi2Winners])]
    }

    // Update participant phases
    for (const pid of nextPhaseParticipants) {
      const p = participants.find(p => p.id === pid)
      if (p && !p.phases?.includes(next)) {
        batch.update(doc(db, 'events', event.id, 'participants', pid), {
          phases: [...(p.phases ?? []), next],
        })
      }
    }

    // Shuffle the order for this phase and set first slide
    const shuffledOrder = shuffle(nextPhaseParticipants)
    const firstId = shuffledOrder[0] ?? null

    batch.update(doc(db, 'events', event.id), {
      phase: next,
      shuffledOrder,
      currentSlide: firstId
        ? { participantId: firstId, action: 'present', mode: 'presentation', bannerVisible: true }
        : null,
    })

    await batch.commit()
  }

  async function goBack() {
    if (!prevPhaseVal) return
    if (!confirm(`¿Volver a la fase "${PHASE_LABELS[prevPhaseVal]}"? El progreso de la fase actual se perderá.`)) return
    await updateDoc(doc(db, 'events', event.id), {
      phase: prevPhaseVal,
      currentSlide: null,
    })
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Control de fases</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {PHASE_ORDER.filter(p => p !== 'done').map(p => (
          <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: phase === p ? 'var(--color-primary)' : PHASE_ORDER.indexOf(p) < PHASE_ORDER.indexOf(phase) ? 'var(--color-success)' : 'var(--bg-secondary)',
              border: `2px solid ${phase === p ? 'var(--color-primary)' : PHASE_ORDER.indexOf(p) < PHASE_ORDER.indexOf(phase) ? 'var(--color-success)' : 'var(--border-color)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>
              {PHASE_ORDER.indexOf(p) < PHASE_ORDER.indexOf(phase) ? '✓' : PHASE_ORDER.indexOf(p) + 1}
            </div>
            <span style={{ fontSize: '10px', color: phase === p ? 'var(--color-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {PHASE_LABELS[p]}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          onClick={goBack}
          disabled={!prevPhaseVal}
          title={prevPhaseVal ? `Volver a ${PHASE_LABELS[prevPhaseVal]}` : 'Ya estás en la primera fase'}
        >
          ← Fase anterior
        </button>
        <span className={`badge badge-${phase}`}>{PHASE_LABELS[phase]}</span>
        {!isLast && (
          <button className="btn btn-accent" onClick={advance}>
            Avanzar → {PHASE_LABELS[nextPhase(phase)]}
          </button>
        )}
        {isLast && <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>🏆 Evento finalizado</span>}
      </div>
      {phase !== 'lobby' && phase !== 'done' && (
        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Al avanzar se seleccionarán automáticamente los participantes con más puntos para la siguiente fase.
        </p>
      )}
    </div>
  )
}
