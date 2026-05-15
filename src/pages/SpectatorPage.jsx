import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useEvent } from '../hooks/useEvent'
import { useParticipants } from '../hooks/useParticipants'
import { useVotes } from '../hooks/useVotes'
import Loader from '../components/shared/Loader'
import SlideDisplay from '../components/spectator/SlideDisplay'
import VotingPanel from '../components/spectator/VotingPanel'
import ResultsSlide from '../components/spectator/ResultsSlide'
import { PHASE_LABELS, getVoterId, computeScores } from '../utils/scoring'
import FlagImage from '../components/shared/FlagImage'

export default function SpectatorPage() {
  const { id } = useParams()
  const { event, loading, error } = useEvent(id)
  const { participants } = useParticipants(id)
  const { votes } = useVotes(id)
  const [voterName, setVoterName] = useState(() => localStorage.getItem('nv_voter_name') ?? '')
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem('nv_voter_name'))
  const [showVoting, setShowVoting] = useState(false)

  useEffect(() => {
    if (event?.currentSlide?.action === 'vote') setShowVoting(true)
    else setShowVoting(false)
  }, [event?.currentSlide?.action])

  if (loading) return <Loader text="Conectando al evento..." />
  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--color-danger)' }}>{error ?? 'Evento no encontrado.'}</p>
        <Link to="/" className="btn btn-secondary">Volver al inicio</Link>
      </div>
    )
  }

  if (!nameSet) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '24px' }}>
        <div className="stars-bg" />
        <div className="card" style={{ maxWidth: '360px', width: '100%', textAlign: 'center', padding: '40px 32px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌟</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{event.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>¿Cómo quieres aparecer en los votos?</p>
          <form onSubmit={e => {
            e.preventDefault()
            const name = voterName.trim() || 'Anónimo'
            setVoterName(name)
            localStorage.setItem('nv_voter_name', name)
            setNameSet(true)
          }}>
            <input className="input" placeholder="Tu nombre o apodo" value={voterName}
              onChange={e => setVoterName(e.target.value)} style={{ marginBottom: '12px', textAlign: 'center' }} autoFocus />
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Entrar al evento ✨</button>
          </form>
        </div>
      </div>
    )
  }

  const phase = event.phase
  const currentSlide = event.currentSlide
  const action = currentSlide?.action
  const currentParticipant = participants.find(p => p.id === currentSlide?.participantId)
  const phaseParticipants = participants.filter(p => p.phases?.includes(phase))
  const voterId = getVoterId()
  const myVote = votes.find(v => v.userId === voterId)
  const myBallot = myVote?.[phase] ?? []
  const scores = computeScores(votes, phase === 'done' ? 'final' : phase, phaseParticipants.map(p => p.id))
  const sorted = phaseParticipants.slice().sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))

  return (
    <div className="page">
      <div className="stars-bg" />
      <div className="header">
        <div className="header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/" className="logo">⭐ NV</Link>
            <span className={`badge badge-${phase}`}>{PHASE_LABELS[phase]}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{voterName}</span>
            {action === 'vote' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowVoting(v => !v)}>
                {showVoting ? '📺 Ver slide' : '🗳️ Votar'}
              </button>
            )}
            {action === 'waiting' && (
              <span style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600 }}>🔒 Votaciones cerradas</span>
            )}
          </div>
        </div>
      </div>

      <div className="page-content" style={{ position: 'relative', zIndex: 1 }}>
        {phase === 'lobby' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ marginBottom: '8px' }}>El evento está a punto de comenzar</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Espera a que el organizador inicie la primera fase.</p>
          </div>
        )}

        {phase === 'done' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>🏆</div>
              <h2 style={{ marginBottom: '8px' }}>¡Evento finalizado!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Resultados finales de {event.name}</p>
            </div>
            <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sorted.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                  background: i === 0 ? 'rgba(255,215,0,0.1)' : 'var(--bg-card)', borderRadius: '10px',
                  border: `1px solid ${i === 0 ? 'rgba(255,215,0,0.4)' : 'var(--border-color)'}`,
                }}>
                  <span style={{ fontSize: i < 3 ? '24px' : '16px', minWidth: '32px', textAlign: 'center' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><FlagImage code={p.country} size={18} /> {p.groupName}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{p.song}</div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-accent)' }}>{scores[p.id] ?? 0} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase !== 'lobby' && phase !== 'done' && (
          <>
            {action === 'waiting' ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ fontSize: '56px' }}>🔒</div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-accent)' }}>Votaciones cerradas</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Esperando la presentación de resultados…</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: 'var(--color-accent)',
                      animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <style>{`@keyframes bounce-dot { 0%,80%,100%{transform:scale(0.6);opacity:.4} 40%{transform:scale(1);opacity:1} }`}</style>
              </div>
            ) : action === 'results' ? (
              <div>
                <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>📊 Resultados — {PHASE_LABELS[phase]}</h3>
                <ResultsSlide event={event} participants={participants} votes={votes} compact />
              </div>
            ) : action === 'winner' ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '60px', marginBottom: '12px' }}>🏆</div>
                <div style={{ marginBottom: '8px' }}><FlagImage code={currentParticipant?.country} size={48} /></div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '6px',
                  background: 'linear-gradient(135deg, #fff, var(--color-accent))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {currentParticipant?.groupName}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{currentParticipant?.song}"</p>
              </div>
            ) : showVoting && action === 'vote' ? (
              <VotingPanel eventId={id} phase={phase} participants={phaseParticipants} existingVote={myBallot} />
            ) : (
              <SlideDisplay participant={currentParticipant} action={action} mode={currentSlide?.mode} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
