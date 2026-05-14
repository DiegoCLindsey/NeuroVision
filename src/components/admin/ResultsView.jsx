import { useVotes } from '../../hooks/useVotes'
import { computeScores, POINTS, countryFlag, PHASE_LABELS } from '../../utils/scoring'

export default function ResultsView({ event, participants }) {
  const { votes, loading } = useVotes(event.id)

  const phases = ['qualifying', 'semi1', 'semi2', 'final'].filter(ph =>
    ph === 'qualifying' || participants.some(p => p.phases?.includes(ph))
  )

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando votos...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h3 style={{ fontSize: '16px' }}>Resultados en vivo</h3>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{votes.length} votante(s)</span>
      </div>

      {phases.map(ph => {
        const phaseParticipants = ph === 'qualifying'
          ? participants
          : participants.filter(p => p.phases?.includes(ph))

        if (phaseParticipants.length === 0) return null

        const scores = computeScores(votes, ph, phaseParticipants.map(p => p.id))
        const sorted = phaseParticipants.slice().sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
        const qualifyTop = event.config?.qualifyTop ?? 10
        const maxScore = sorted[0] ? (scores[sorted[0].id] ?? 0) : 1

        return (
          <div key={ph}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {PHASE_LABELS[ph]}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sorted.map((p, i) => {
                const score = scores[p.id] ?? 0
                const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
                const qualifies = ph === 'qualifying' && i < qualifyTop
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                    background: 'var(--bg-card)', borderRadius: '8px',
                    border: `1px solid ${qualifies && ph === 'qualifying' ? 'rgba(0,212,170,0.3)' : 'var(--border-color)'}`,
                  }}>
                    <span style={{
                      minWidth: '24px', fontWeight: 800, fontSize: '15px',
                      color: i === 0 ? 'var(--color-accent)' : i < 3 ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>
                          {countryFlag(p.country)} {p.groupName}
                          {qualifies && ph === 'qualifying' && <span style={{ marginLeft: '8px', color: 'var(--color-success)', fontSize: '11px' }}>✓ CLASIFICA</span>}
                        </span>
                        <span style={{ fontWeight: 800, color: 'var(--color-accent)', fontSize: '16px' }}>{score} pts</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: i === 0 ? 'var(--color-accent)' : 'var(--color-primary)',
                          borderRadius: '2px', transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="card" style={{ background: 'var(--bg-secondary)' }}>
        <p className="label" style={{ marginBottom: '8px' }}>Sistema de puntuación</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {POINTS.map((pts, i) => (
            <span key={i} style={{ background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
              {i + 1}º → <strong style={{ color: 'var(--color-accent)' }}>{pts} pts</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
