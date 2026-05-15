import FlagImage from '../shared/FlagImage'

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

const starPoints = '100,12 122,72 186,72 134,110 155,172 100,133 45,172 66,110 14,72 78,72'

function MiniStar({ participant }) {
  const code = participant?.country?.toLowerCase()
  const flagUrl = code && code !== 'other' ? `https://flagcdn.com/w640/${code}.png` : null
  const photoUrl = participant?.photoUrl

  return (
    <div style={{ width: '120px', height: '111px', flexShrink: 0 }}>
      <svg viewBox="0 0 200 185" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}>
        <defs>
          <clipPath id="mini-star-clip">
            <polygon points={starPoints} />
          </clipPath>
          {photoUrl && (
            <pattern id="mini-photo-fill" patternUnits="userSpaceOnUse" x="0" y="0" width="200" height="185">
              <image href={photoUrl} x="-10" y="-10" width="220" height="205" preserveAspectRatio="xMidYMid slice" />
            </pattern>
          )}
        </defs>
        {photoUrl ? (
          <polygon points={starPoints} fill="url(#mini-photo-fill)" clipPath="url(#mini-star-clip)" />
        ) : flagUrl ? (
          <g clipPath="url(#mini-star-clip)">
            <image href={flagUrl} x="0" y="0" width="200" height="185" preserveAspectRatio="xMidYMid slice" />
          </g>
        ) : (
          <polygon points={starPoints} fill="var(--color-secondary)" clipPath="url(#mini-star-clip)" />
        )}
        <polygon points={starPoints} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />
      </svg>
    </div>
  )
}

export default function SlideDisplay({ participant, action, mode }) {
  if (!participant) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>⭐</div>
        <p style={{ fontSize: '18px' }}>Esperando al organizador...</p>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>El evento comenzará en breve</p>
      </div>
    )
  }

  const effectiveMode = mode ?? 'presentation'
  const ytId = getYouTubeId(participant.videoUrl)

  // Performance mode: show video embed prominently
  if (effectiveMode === 'performance') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <MiniStar participant={participant} />
          <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <FlagImage code={participant.country} size={20} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Actuación en directo</span>
            </div>
            <h2 style={{
              fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 900, lineHeight: 1.1,
              background: 'linear-gradient(135deg, #fff, var(--color-accent))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {participant.groupName}
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
              "{participant.song}"
            </p>
          </div>
        </div>
        {ytId && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={participant.song}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Presentation mode (default): show star + info, NO video
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <MiniStar participant={participant} />
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ marginBottom: '8px' }}>
            <FlagImage code={participant.country} size={32} />
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

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  )
}
