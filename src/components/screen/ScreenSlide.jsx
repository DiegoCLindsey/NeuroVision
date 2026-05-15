import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { PHASE_LABELS } from '../../utils/scoring'
import FlagImage from '../shared/FlagImage'
import ResultsSlide from '../spectator/ResultsSlide'
import PresentationSlide from '../shared/PresentationSlide'

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
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
    const spectatorUrl = event?.id
      ? `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/event/${event.id}`
      : null

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '40px' }}>
        <div className="stars-bg" />
        <div style={{ fontSize: '80px', animation: 'float 3s ease-in-out infinite', position: 'relative', zIndex: 1 }}>⭐</div>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 900, textAlign: 'center', position: 'relative', zIndex: 1,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {event?.name ?? 'NeuroVision'}
        </h1>
        <span className={`badge badge-${phase}`} style={{ fontSize: '14px', padding: '6px 16px', position: 'relative', zIndex: 1 }}>
          {PHASE_LABELS[phase] ?? phase}
        </span>

        {phase === 'lobby' && spectatorUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 'clamp(14px, 2vw, 22px)', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Escanea para unirte al evento
            </p>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 0 40px rgba(255,215,0,0.3)' }}>
              <QRCodeSVG value={spectatorUrl} size={220} />
            </div>
            <p style={{ fontSize: 'clamp(11px, 1.2vw, 14px)', color: 'var(--text-muted)', wordBreak: 'break-all', maxWidth: '400px', textAlign: 'center' }}>
              {spectatorUrl}
            </p>
          </div>
        )}

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
            key={`${participant?.id}-${mode}`}
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

  // Presentation mode (default)
  const spectatorUrl = event?.id
    ? `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/event/${event.id}`
    : null

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <PresentationSlide
        key={`${participant?.id ?? 'none'}-${mode}`}
        participant={participant}
        action={action}
      />
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
        <span className={`badge badge-${phase}`} style={{ fontSize: '13px', padding: '5px 14px' }}>{PHASE_LABELS[phase]}</span>
      </div>
      {action === 'vote' && spectatorUrl && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px', zIndex: 10,
          background: '#fff', padding: '10px', borderRadius: '12px',
          boxShadow: '0 0 30px rgba(255,215,0,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        }}>
          <QRCodeSVG value={spectatorUrl} size={110} />
          <p style={{ color: '#000', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>VOTA DESDE TU MÓVIL</p>
        </div>
      )}
      {participant && (
        <InfoBanner participant={participant} bannerVisible={bannerVisible} autoHideSecs={bannerAutoHideSecs} />
      )}
    </div>
  )
}
