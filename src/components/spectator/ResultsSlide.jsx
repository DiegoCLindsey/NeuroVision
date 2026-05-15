import { computeScores, getVotesForParticipant, POINTS } from '../../utils/scoring'
import FlagImage from '../shared/FlagImage'

export default function ResultsSlide({ event, participants, votes, compact = false }) {
  const rd = event.currentSlide?.resultsData
  if (!rd) return null

  const phase = rd.phase ?? event.phase
  const phaseParticipants = participants.filter(p => p.phases?.includes(phase))
  const order = rd.order ?? []
  const currentIndex = rd.currentIndex ?? 0
  const revealedVoters = rd.revealedVoters ?? 0
  const revealAll = rd.revealAll ?? false
  const showFinal = rd.showFinal ?? false

  const runningScores = {}
  phaseParticipants.forEach(p => { runningScores[p.id] = 0 })

  for (let i = 0; i < currentIndex; i++) {
    const pid = order[i]
    const pvotes = getVotesForParticipant(votes, phase, pid)
    pvotes.forEach(v => { runningScores[pid] = (runningScores[pid] ?? 0) + v.points })
  }

  const currentPid = order[currentIndex]
  const currentVoters = currentPid ? getVotesForParticipant(votes, phase, currentPid) : []
  const toReveal = revealAll ? currentVoters : currentVoters.slice(0, revealedVoters)
  toReveal.forEach(v => { runningScores[currentPid] = (runningScores[currentPid] ?? 0) + v.points })

  const currentParticipant = participants.find(p => p.id === currentPid)
  const totalFromVotes = computeScores(votes, phase, phaseParticipants.map(p => p.id))

  const sortedForFinal = phaseParticipants.slice()
    .sort((a, b) => (totalFromVotes[b.id] ?? 0) - (totalFromVotes[a.id] ?? 0))

  const sortedRunning = phaseParticipants.slice()
    .sort((a, b) => (runningScores[b.id] ?? 0) - (runningScores[a.id] ?? 0))

  const maxScore = Math.max(...sortedRunning.map(p => runningScores[p.id] ?? 0), 1)

  if (showFinal) {
    return (
      <div style={{ maxWidth: compact ? '100%' : '700px', margin: '0 auto' }}>
        <h3 style={{ fontSize: compact ? '16px' : '22px', fontWeight: 800, marginBottom: '20px', textAlign: 'center' }}>
          🏁 Clasificación final
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedForFinal.map((p, i) => {
            const score = totalFromVotes[p.id] ?? 0
            const maxS = Math.max(...sortedForFinal.map(x => totalFromVotes[x.id] ?? 0), 1)
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                background: i === 0 ? 'rgba(255,215,0,0.15)' : 'var(--bg-card)',
                borderRadius: '10px',
                border: `1px solid ${i === 0 ? 'rgba(255,215,0,0.5)' : i === 1 ? 'rgba(192,192,192,0.4)' : i === 2 ? 'rgba(205,127,50,0.4)' : 'var(--border-color)'}`,
              }}>
                <span style={{ fontSize: i < 3 ? '28px' : '18px', fontWeight: 800, minWidth: '36px', textAlign: 'center' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                {p.photoUrl && (
                  <img src={p.photoUrl} alt={p.groupName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: compact ? '14px' : '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FlagImage code={p.country} size={16} /> {p.groupName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{p.song}</div>
                  <div style={{ height: '3px', background: 'var(--bg-secondary)', borderRadius: '2px', marginTop: '6px' }}>
                    <div style={{ height: '100%', width: `${(score / maxS) * 100}%`, background: i === 0 ? 'var(--color-accent)' : 'var(--color-primary)', borderRadius: '2px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
                <span style={{ fontWeight: 900, fontSize: compact ? '18px' : '24px', color: 'var(--color-accent)' }}>{score}</span>
              </div>
            )
          })}
        </div>
        <style>{`@keyframes fadeSlideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', gap: '24px', alignItems: 'flex-start' }}>
      <div style={{ flex: compact ? 'unset' : '0 0 280px', width: compact ? '100%' : '280px' }}>
        {currentParticipant ? (
          <div className="card" style={{ textAlign: 'center', border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.05)' }}>
            {currentParticipant.photoUrl ? (
              <img src={currentParticipant.photoUrl} alt={currentParticipant.groupName}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', border: '3px solid var(--color-accent)' }} />
            ) : (
              <div style={{ marginBottom: '12px' }}><FlagImage code={currentParticipant.country} size={48} /></div>
            )}
            <h3 style={{ fontWeight: 800, marginBottom: '4px' }}>{currentParticipant.groupName}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '12px' }}>{currentParticipant.song}</p>
            <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--color-accent)' }}>
              {runningScores[currentPid] ?? 0} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>pts</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {toReveal.length}/{currentVoters.length} votos revelados
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Calculando...</div>
        )}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {toReveal.map((v) => (
            <div key={v.userId} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
              background: 'var(--bg-card)', borderRadius: '8px',
              animation: 'fadeSlideIn 0.3s ease forwards',
              border: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '20px' }}>👤</span>
              <span style={{ flex: 1, fontSize: '14px' }}>{v.voterName}</span>
              <span style={{ fontWeight: 800, color: v.rank < 2 ? '#ffd700' : v.rank < 4 ? '#e94560' : '#a0a0ff', fontSize: '16px' }}>
                +{v.points} pts
              </span>
            </div>
          ))}
          {toReveal.length === 0 && currentParticipant && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px', fontSize: '13px' }}>
              Esperando revelar votos...
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
          Marcador en curso
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sortedRunning.map((p, i) => {
            const score = runningScores[p.id] ?? 0
            const isRevealed = order.indexOf(p.id) < currentIndex || p.id === currentPid
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                background: p.id === currentPid ? 'rgba(255,215,0,0.1)' : 'var(--bg-card)',
                borderRadius: '8px',
                border: `1px solid ${p.id === currentPid ? 'rgba(255,215,0,0.4)' : 'var(--border-color)'}`,
                opacity: isRevealed ? 1 : 0.4,
                transition: 'all 0.5s ease',
              }}>
                <span style={{ fontWeight: 800, minWidth: '24px', color: i < 3 ? 'var(--color-accent)' : 'var(--text-muted)', fontSize: '14px' }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FlagImage code={p.country} size={14} /> {p.groupName}
                    </span>
                    <span style={{ fontWeight: 800, color: score > 0 ? 'var(--color-accent)' : 'var(--text-muted)', fontSize: '15px' }}>
                      {score}
                    </span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--bg-secondary)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${(score / maxScore) * 100}%`, background: p.id === currentPid ? 'var(--color-accent)' : 'var(--color-primary)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <style>{`@keyframes fadeSlideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  )
}
