import { useState, useEffect, useRef } from 'react'
import { PHASE_LABELS } from '../../utils/scoring'
import FlagImage from '../shared/FlagImage'
import ResultsSlide from '../spectator/ResultsSlide'

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

const starPoints = '100,12 122,72 186,72 134,110 155,172 100,133 45,172 66,110 14,72 78,72'

function StarArtwork({ participant, animStep }) {
  const code = participant?.country?.toLowerCase()
  const flagUrl = code && code !== 'other' ? `https://flagcdn.com/w640/${code}.png` : null
  const photoUrl = participant?.photoUrl

  // During step 1 (animStep === 1): large star, no fill, outline + glow, centered
  // During step 2+ (animStep >= 2): normal star with flag fill
  const isStep1 = animStep === 1

  if (isStep1) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '200px', height: '185px',
          animation: 'star-zoom-in 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards',
          transformOrigin: 'center center',
        }}>
          <svg viewBox="0 0 200 185" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.9)) drop-shadow(0 0 60px rgba(255,215,0,0.5))' }}>
            <polygon points={starPoints} fill="none" stroke="var(--color-accent)" strokeWidth="3" />
          </svg>
        </div>
        <style>{`
          @keyframes star-zoom-in {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

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
            <g clipPath="url(#star-clip)">
              <image
                href={flagUrl}
                x="0" y="0" width="200" height="185"
                preserveAspectRatio="xMidYMid slice"
                style={{ animation: 'wave-flag 3s ease-in-out infinite', transformOrigin: '100px 92px' }}
              />
            </g>
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
        <FlagImage code={participant?.country} size={28} />
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
  const mode = event?.currentSlide?.mode ?? 'presentation'
  const ytId = participant ? getYouTubeId(participant.videoUrl) : null
  const phase = event?.phase ?? 'lobby'
  const bannerAutoHideSecs = event?.config?.bannerAutoHideSecs ?? 10
  const bannerVisible = event?.currentSlide?.bannerVisible !== false

  // 4-step animation state for presentation mode
  const [animStep, setAnimStep] = useState(0)
  const prevIdRef = useRef(null)

  useEffect(() => {
    if (mode !== 'presentation') return
    if (!participant?.id) return
    if (participant.id === prevIdRef.current) return
    prevIdRef.current = participant.id

    // Start animation sequence
    setAnimStep(1)
    const t1 = setTimeout(() => setAnimStep(2), 800)
    const t2 = setTimeout(() => setAnimStep(3), 1600)
    const t3 = setTimeout(() => setAnimStep(4), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [participant?.id, mode])

  // Reset animation when mode changes
  useEffect(() => {
    if (mode !== 'presentation') {
      setAnimStep(0)
      prevIdRef.current = null
    }
  }, [mode])

  if (action === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', textAlign: 'center', padding: '40px' }}>
        <div className="stars-bg" />
        <div style={{ fontSize: '80px', animation: 'pulse-glow 2s ease-in-out infinite' }}>🔒</div>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 900, color: 'var(--color-accent)', position: 'relative', zIndex: 1 }}>
          Votaciones cerradas
        </h2>
        <p style={{ fontSize: 'clamp(16px, 2vw, 24px)', color: 'var(--text-secondary)', position: 'relative', zIndex: 1 }}>
          Esperando la presentación de resultados…
        </p>
        <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: 'var(--color-accent)',
              animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes bounce-dot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
          @keyframes pulse-glow { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        `}</style>
      </div>
    )
  }

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
        <div style={{ marginBottom: '8px' }}>
          <FlagImage code={participant?.country} size={64} />
        </div>
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

  // Performance mode: video fullscreen
  if (mode === 'performance') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', position: 'relative' }}>
        {ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&controls=1`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen title={participant?.song}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '48px' }}>🎵</span>
            <p style={{ color: 'var(--text-secondary)' }}>Sin video disponible</p>
          </div>
        )}
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
          <span className={`badge badge-${phase}`} style={{ fontSize: '13px', padding: '5px 14px' }}>{PHASE_LABELS[phase]}</span>
        </div>
        {participant?.photoUrl && (
          <div style={{
            position: 'absolute', top: '20px', right: '20px', zIndex: 10,
            width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
            border: '3px solid var(--color-accent)',
          }}>
            <img src={participant.photoUrl} alt={participant.groupName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>
    )
  }

  // Presentation mode (default): show star + info, NO video
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Step 1: large star zoom in */}
      {animStep === 1 && <StarArtwork participant={participant} animStep={1} />}

      {/* Steps 2+: normal presentation layout */}
      {animStep !== 1 && (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(24px, 4vw, 60px)',
          background: 'radial-gradient(ellipse at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        }}>
          <StarArtwork participant={participant} animStep={animStep} />

          {/* Step 3: artist name fades in */}
          <div style={{
            marginTop: '24px', textAlign: 'center',
            opacity: animStep >= 3 ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}>
            <div style={{
              fontWeight: 900, fontSize: 'clamp(24px, 4vw, 48px)',
              background: 'linear-gradient(135deg, #fff, var(--color-accent))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {participant?.groupName}
            </div>
          </div>

          {/* Step 4: song name fades in */}
          <div style={{
            marginTop: '8px', textAlign: 'center',
            opacity: animStep >= 4 ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}>
            <div style={{ fontSize: 'clamp(16px, 2.5vw, 28px)', color: 'var(--color-accent)', fontStyle: 'italic' }}>
              "{participant?.song}"
            </div>
          </div>
        </div>
      )}

      {action === 'vote' && (
        <div style={{
          position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)',
          padding: '12px 28px',
          background: 'rgba(233,69,96,0.2)', border: '2px solid var(--color-primary)',
          borderRadius: '100px', color: 'var(--color-primary)', fontWeight: 800,
          fontSize: 'clamp(14px, 2vw, 20px)', animation: 'pulse 1.5s ease-in-out infinite',
          whiteSpace: 'nowrap',
        }}>
          🗳️ ¡VOTACIÓN ABIERTA!
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
