import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { computeScores, getVotesForParticipant, countryFlag, POINTS } from '../../utils/scoring'

export default function ResultsSlideControl({ event, participants, votes }) {
  const phase = event.phase
  const rd = event.currentSlide?.resultsData
  const phaseParticipants = participants.filter(p => p.phases?.includes(phase))

  async function startResults() {
    const shuffled = [...phaseParticipants].map(p => p.id).sort(() => Math.random() - 0.5)
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: {
        action: 'results',
        resultsData: {
          phase,
          order: shuffled,
          currentIndex: 0,
          revealedVoters: 0,
          revealMode: rd?.revealMode ?? 'all-at-once',
          showFinal: false,
        },
      },
    })
  }

  async function patch(fields) {
    const update = {}
    for (const [k, v] of Object.entries(fields)) {
      update[`currentSlide.resultsData.${k}`] = v
    }
    await updateDoc(doc(db, 'events', event.id), update)
  }

  async function nextParticipant() {
    const next = (rd.currentIndex ?? 0) + 1
    const isLast = next >= rd.order.length
    await patch({ currentIndex: next, revealedVoters: 0, revealAll: false, showFinal: isLast })
  }

  async function revealNextVoter() {
    await patch({ revealedVoters: (rd.revealedVoters ?? 0) + 1 })
  }

  async function revealAll() {
    await patch({ revealAll: true })
  }

  async function showFinalRanking() {
    await patch({ showFinal: true })
  }

  async function toggleRevealMode() {
    await patch({ revealMode: rd.revealMode === 'one-by-one' ? 'all-at-once' : 'one-by-one' })
  }

  async function showWinner() {
    const scores = computeScores(votes, 'final', phaseParticipants.map(p => p.id))
    const winnerId = Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0]
    if (!winnerId) return
    await updateDoc(doc(db, 'events', event.id), {
      currentSlide: { action: 'winner', participantId: winnerId },
    })
  }

  if (event.currentSlide?.action !== 'results') {
    return (
      <div style={{ marginTop: '12px' }}>
        <button className="btn btn-primary" onClick={startResults} disabled={phaseParticipants.length === 0}>
          🎬 Iniciar presentación de resultados
        </button>
      </div>
    )
  }

  if (!rd) return null

  const currentPid = rd.order?.[rd.currentIndex]
  const currentParticipant = participants.find(p => p.id === currentPid)
  const votersForCurrent = getVotesForParticipant(votes, phase, currentPid ?? '')
  const revealedCount = rd.revealAll ? votersForCurrent.length : (rd.revealedVoters ?? 0)
  const isLastParticipant = (rd.currentIndex ?? 0) >= (rd.order?.length ?? 0) - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Participante {(rd.currentIndex ?? 0) + 1} / {rd.order?.length ?? 0}
        </span>
        {currentParticipant && (
          <strong style={{ fontSize: '14px' }}>
            {countryFlag(currentParticipant.country)} {currentParticipant.groupName}
          </strong>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {rd.revealMode === 'one-by-one' && !rd.revealAll && !rd.showFinal && (
          <button className="btn btn-primary btn-sm" onClick={revealNextVoter}
            disabled={revealedCount >= votersForCurrent.length}>
            👁️ Revelar voto ({revealedCount}/{votersForCurrent.length})
          </button>
        )}
        {!rd.revealAll && !rd.showFinal && (
          <button className="btn btn-secondary btn-sm" onClick={revealAll}>
            Revelar todos
          </button>
        )}
        {!rd.showFinal && (
          <button className="btn btn-accent btn-sm" onClick={isLastParticipant ? showFinalRanking : nextParticipant}>
            {isLastParticipant ? '🏁 Ver ranking final' : 'Siguiente ▶'}
          </button>
        )}
        {rd.showFinal && phase === 'final' && (
          <button className="btn btn-accent btn-sm" onClick={showWinner}>
            🏆 Revelar ganador
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Modo de revelación:</span>
        <button className="btn btn-secondary btn-sm" onClick={toggleRevealMode}>
          {rd.revealMode === 'one-by-one' ? '📋 Uno a uno' : '📋 Todos a la vez'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={startResults}>↺ Reiniciar</button>
      </div>
    </div>
  )
}
