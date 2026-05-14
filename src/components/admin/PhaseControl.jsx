import { doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { nextPhase, topParticipants, computeScores, PHASE_LABELS, PHASE_ORDER } from '../../utils/scoring'

export default function PhaseControl({ event, participants, votes }) {
  const phase = event.phase
  const isLast = phase === 'done'

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
      const scores = computeScores(votes, 'qualifying', participants.map(p => p.id))
      const top = topParticipants(scores, event.config?.qualifyTop ?? 10)
      // First half to semi1
      nextPhaseParticipants = top.slice(0, Math.ceil(top.length / 2))
    } else if (phase === 'semi1') {
      const inSemi1 = participants.filter(p => p.phases?.includes('semi1')).map(p => p.id)
      const scores = computeScores(votes, 'semi1', inSemi1)
      nextPhaseParticipants = topParticipants(scores, Math.ceil(inSemi1.length / 2))
      // Also put second half of qualifying into semi2
      const qualScores = computeScores(votes, 'qualifying', participants.map(p => p.id))
      const allTop = topParticipants(qualScores, event.config?.qualifyTop ?? 10)
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
      const semi2Winners = topParticipants(scores, Math.ceil(inSemi2.length / 2))
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

    // Set first slide for new phase
    const firstId = nextPhaseParticipants[0] ?? null
    batch.update(doc(db, 'events', event.id), {
      phase: next,
      currentSlide: firstId ? { participantId: firstId, action: 'present' } : null,
    })

    await batch.commit()
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
