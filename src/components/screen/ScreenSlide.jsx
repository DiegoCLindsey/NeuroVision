import { countryFlag, PHASE_LABELS } from '../../utils/scoring'

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function ScreenSlide({ event, participant, action }) {
  const ytId = participant ? getYouTubeId(participant.videoUrl) : null
  const phase = event?.phase ?? 'lobby'

  if (!participant) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '24px',
      }}>
        <div style={{
          fontSize: '80px', animation: 'float 3s ease-in-out infinite',
        }}>⭐</div>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 900, textAlign: 'center',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {event?.name ?? 'NeuroVision'}
        </h1>
        <span className={`badge badge-${phase}`} style={{ fontSize: '14px', padding: '6px 16px' }}>
          {PHASE_LABELS[phase] ?? phase}
        </span>
        <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)', display: 'grid',
      gridTemplateColumns: ytId ? '1fr 1fr' : '1fr',
      gridTemplateRows: '1fr',
      gap: 0,
    }}>
      {/* Info panel */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(32px, 5vw, 80px)',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
      }}>
        <div style={{ fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 1, marginBottom: '16px' }}>
          {countryFlag(participant.country)}
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 64px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '16px',
          background: 'linear-gradient(135deg, #fff 0%, var(--color-accent) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {participant.groupName}
        </h1>
        <p style={{ fontSize: 'clamp(18px, 3vw, 32px)', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '24px' }}>
          "{participant.song}"
        </p>
        {action === 'vote' && (
          <div style={{
            display: 'inline-block', padding: '12px 28px',
            background: 'rgba(233,69,96,0.2)', border: '2px solid var(--color-primary)',
            borderRadius: '100px', color: 'var(--color-primary)', fontWeight: 800,
            fontSize: 'clamp(14px, 2vw, 20px)', animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            🗳️ ¡VOTACIÓN ABIERTA!
          </div>
        )}
        {participant.photoUrl && !ytId && (
          <div style={{ marginTop: '32px', maxWidth: '320px' }}>
            <img src={participant.photoUrl} alt={participant.groupName} style={{ width: '100%', borderRadius: '16px', boxShadow: 'var(--shadow-glow)' }} />
          </div>
        )}
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>NeuroVision</span>
          <span className={`badge badge-${phase}`}>{PHASE_LABELS[phase]}</span>
        </div>
      </div>

      {/* Video panel */}
      {ytId && (
        <div style={{ position: 'relative', background: '#000' }}>
          {participant.photoUrl && (
            <div style={{
              position: 'absolute', top: '24px', right: '24px', zIndex: 10,
              width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-accent)',
            }}>
              <img src={participant.photoUrl} alt={participant.groupName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&controls=1`}
            style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={participant.song}
          />
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  )
}
