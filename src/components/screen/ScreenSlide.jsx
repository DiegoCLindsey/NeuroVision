import { useState, useEffect } from 'react'
import { countryFlag, PHASE_LABELS } from '../../utils/scoring'
import ResultsSlide from '../spectator/ResultsSlide'

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function StarArtwork({ participant }) {
  const code = participant?.country?.toLowerCase()
  const flagUrl = code && code !== 'other' ? `https://flagcdn.com/w640/${code}.png` : null
  const photoUrl = participant?.photoUrl
  const starPoints = '100,12 122,72 186,72 134,110 155,172 100,133 45,172 66,110 14,72 78,72'

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 'min(60vw, 60vh)', height: 'min(60vw, 60vh)', position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: '-10%',
          background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.25) 0%, transparent 70%)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }} />
        <svg viewBox="0 0 200 185" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.6))' }}>
          <defs>
            <clipPath id="star-clip">
              <polygon points={starPoints} />
            </clipPath>
            {photoUrl && (
              <pattern id="photo-fill" patternUnits="userSpaceOnUse" x="0" y="0" width="200" height="185">
                <image href={photoUrl} x="-10" y="-10" width="220" height="205" preserveAspectRatio="xMidYMid slice" />
              </pattern>
            )}
          </defs>
          {photoUrl ? (
            <polygon points={starPoints} fill="url(#photo-fill)" clipPath="url(#star-clip)" />
          ) : flagUrl ? (
            <image
              href={flagUrl}
              x="0" y="0" width="200" height="185"
              clipPath="url(#star-clip)"
              preserveAspectRatio="xMidYMid slice"
              style={{ animation: 'wave-flag 3s ease-in-out infinite', transformOrigin: '100px 92px' }}
            />
          ) : (
            <polygon points={starPoints} fill="var(--color-secondary)" clipPath="url(#star-clip)" />
          )}
          <polygon points={starPoints} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />
        </svg>
      </div>
      <style>{`
        @keyframes pulse-glow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes wave-flag {
          0%, 100% { transform: skewX(0deg) scaleX(1); }
          25% { transform: skewX(-4deg) scaleX(1.03); }
          75% { transform: skewX(4deg) scaleX(1.03); }
        }
      `}</style>
    </div>
  )
}

function InfoBanner({ participant, bannerVisible, autoHideSecs }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    if (!autoHideSecs || autoHideSecs <= 0) return
    const t = setTimeout(() => setVisible(false), autoHideSecs * 1000)
    return () => clearTimeout(t)
  }, [participant?.id, autoHideSecs])

  const show = bannerVisible !== false && visible

  return (
    <div style={{
      position: 'fixed', bottom: '32px', left: '50%', transform: `translateX(-50%) translateY(${show ? '0' : '120px'})`,
      transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: 50, pointerEvents: 'none', width: 'min(600px, 90vw)',
    }}>
      <div style={{
        background: 'rgba(10,10,26,0.92)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,215,0,0.3)', borderRadius: '100px',
        padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(255,215,0,0.1)',
      }}>
        <span style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>{countryFlag(participant?.country)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 2vw, 20px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {participant?.groupName}
          </div>
          <div style={{ color: 'var(--color-accent)', fontSize: 'clamp(11px, 1.5vw, 15px)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            "{participant?.song}"
          </div>
        </div>
        <div style={{ flexShrink: 0, fontSize: 'clamp(10px, 1.2vw, 13px)', color: 'var(--text-muted)' }}>NeuroVision</div>
      </div>
    </div>
  )
}

export default function ScreenSlide({ event, participant, action, participants, votes }) {
  const ytId = participant ? getYouTubeId(participant.videoUrl) : null
  const phase = event?.phase ?? 'lobby'
  const bannerAutoHideSecs = event?.config?.bannerAutoHideSecs ?? 10
  const bannerVisible = event?.currentSlide?.bannerVisible !== false

  if (!participant && action !== 'results') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        <div style={{ fontSize: '80px', animation: 'float 3s ease-in-out infinite' }}>⭐</div>
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

  if (action === 'results') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 'clamp(24px, 4vw, 60px)', overflowY: 'auto' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 800 }}>📊 Resultados — {PHASE_LABELS[phase]}</h2>
            <span className={`badge badge-${phase}`}>{PHASE_LABELS[phase]}</span>
          </div>
          <ResultsSlide event={event} participants={participants ?? []} votes={votes ?? []} />
        </div>
      </div>
    )
  }

  if (action === 'winner') {
    const winnerYtId = getYouTubeId(participant?.videoUrl)
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(40px, 8vw, 80px)', marginBottom: '16px', animation: 'bounce 1s ease-in-out infinite alternate' }}>🏆</div>
        <div style={{ fontSize: 'clamp(60px, 10vw, 100px)', marginBottom: '8px' }}>{countryFlag(participant?.country)}</div>
        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 80px)', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, #fff 0%, var(--color-accent) 50%, #fff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: '12px',
        }}>
          {participant?.groupName}
        </h1>
        <p style={{ fontSize: 'clamp(18px, 3vw, 32px)', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '32px' }}>
          "{participant?.song}"
        </p>
        {winnerYtId && (
          <div style={{ width: '100%', maxWidth: '800px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 60px rgba(255,215,0,0.3)' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${winnerYtId}?autoplay=1&rel=0`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen title={participant?.song}
              />
            </div>
          </div>
        )}
        <style>{`
          @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'grid', gridTemplateColumns: ytId ? '1fr 1fr' : '1fr',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(24px, 4vw, 60px)',
        background: 'radial-gradient(ellipse at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
      }}>
        <StarArtwork participant={participant} />
        {action === 'vote' && (
          <div style={{
            marginTop: '24px', padding: '12px 28px',
            background: 'rgba(233,69,96,0.2)', border: '2px solid var(--color-primary)',
            borderRadius: '100px', color: 'var(--color-primary)', fontWeight: 800,
            fontSize: 'clamp(14px, 2vw, 20px)', animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            🗳️ ¡VOTACIÓN ABIERTA!
          </div>
        )}
      </div>
      {ytId && (
        <div style={{ position: 'relative', background: '#000' }}>
          {participant?.photoUrl && (
            <div style={{
              position: 'absolute', top: '20px', right: '20px', zIndex: 10,
              width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
              border: '3px solid var(--color-accent)',
            }}>
              <img src={participant.photoUrl} alt={participant.groupName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&controls=1`}
            style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen title={participant?.song}
          />
        </div>
      )}
      <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
        <span className={`badge badge-${phase}`} style={{ fontSize: '13px', padding: '5px 14px' }}>{PHASE_LABELS[phase]}</span>
      </div>
      {participant && (
        <InfoBanner participant={participant} bannerVisible={bannerVisible} autoHideSecs={bannerAutoHideSecs} />
      )}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  )
}
