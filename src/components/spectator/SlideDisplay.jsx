import { countryFlag } from '../../utils/scoring'

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function SlideDisplay({ participant, action }) {
  if (!participant) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>⭐</div>
        <p style={{ fontSize: '18px' }}>Esperando al organizador...</p>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>El evento comenzará en breve</p>
      </div>
    )
  }

  const ytId = getYouTubeId(participant.videoUrl)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Participant card */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {participant.photoUrl && (
          <div style={{
            width: '140px', height: '140px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
            boxShadow: 'var(--shadow-glow)',
          }}>
            <img src={participant.photoUrl} alt={participant.groupName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontSize: '48px', lineHeight: 1, marginBottom: '8px' }}>
            {countryFlag(participant.country)}
          </div>
          <h2 style={{
            fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 900, lineHeight: 1.1,
            background: 'linear-gradient(135deg, #fff, var(--color-accent))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {participant.groupName}
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
            "{participant.song}"
          </p>
          {action === 'vote' && (
            <div style={{
              display: 'inline-block', marginTop: '16px', padding: '8px 20px',
              background: 'rgba(233,69,96,0.2)', border: '1px solid var(--color-primary)',
              borderRadius: '100px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '14px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              🗳️ ¡Votación abierta!
            </div>
          )}
        </div>
      </div>

      {/* YouTube embed */}
      {ytId && (
        <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={participant.song}
            />
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  )
}
