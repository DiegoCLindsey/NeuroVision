import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { PHASE_LABELS, computeScores } from '../../utils/scoring'
import FlagImage from '../shared/FlagImage'
import ResultsSlide from '../spectator/ResultsSlide'
import PresentationSlide from '../shared/PresentationSlide'

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}


function ytCommand(iframeEl, func) {
  iframeEl?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*')
}

const BTN_STYLE = {
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
  width: '56px', height: '56px', fontSize: '24px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.2s',
}

function WinnerSlide({ participant }) {
  const iframeRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [overlayVisible, setOverlayVisible] = useState(true)
  const ytId = getYouTubeId(participant?.videoUrl)
  const flagUrl = participant?.country ? `https://flagcdn.com/w320/${participant.country.toLowerCase()}.png` : null

  function toggleMute() {
    ytCommand(iframeRef.current, muted ? 'unMute' : 'mute')
    setMuted(m => !m)
  }

  const show = overlayVisible

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      {ytId && (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&controls=0&playlist=${ytId}&rel=0&disablekb=1&enablejsapi=1`}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none',
            filter: show ? 'blur(22px)' : 'blur(0px)',
            transform: 'scale(1.15)', opacity: show ? 0.6 : 1, zIndex: 0,
            pointerEvents: 'none',
            transition: 'filter 5s ease, opacity 5s ease',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="bg"
        />
      )}
      {!ytId && flagUrl && (
        <div style={{
          position: 'absolute', inset: '-5%', zIndex: 0,
          backgroundImage: `url(${flagUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: show ? 'blur(16px)' : 'blur(0px)',
          opacity: show ? 0.3 : 1,
          transform: 'scale(1.1)',
          transition: 'filter 5s ease, opacity 5s ease',
        }} />
      )}
      {/* Dark overlay fades out together with the content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'rgba(0,0,0,0.5)',
        opacity: show ? 1 : 0,
        transition: 'opacity 2s ease',
      }} />
      {/* Winner info */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', textAlign: 'center', padding: '40px',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(-28px)',
        transition: 'opacity 2s ease, transform 2s ease',
        pointerEvents: show ? 'auto' : 'none',
      }}>
        <div style={{ fontSize: 'clamp(40px, 8vw, 80px)', marginBottom: '16px', animation: 'bounce 1s ease-in-out infinite alternate' }}>🏆</div>
        <div style={{ marginBottom: '16px' }}>
          <FlagImage code={participant?.country} size={72} />
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 80px)', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, #fff 0%, var(--color-accent) 50%, #fff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: '16px',
        }}>
          {participant?.groupName}
        </h1>
        <p style={{ fontSize: 'clamp(18px, 3vw, 32px)', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
          "{participant?.song}"
        </p>
      </div>
      {/* Controls */}
      <div style={{ position: 'absolute', bottom: '32px', right: '32px', zIndex: 10, display: 'flex', gap: '12px' }}>
        <button onClick={() => setOverlayVisible(v => !v)} style={BTN_STYLE} title={show ? 'Ocultar texto' : 'Mostrar texto'}>
          {show ? '👁️' : '🫣'}
        </button>
        {ytId && (
          <button onClick={toggleMute} style={BTN_STYLE} title={muted ? 'Activar sonido' : 'Silenciar'}>
            {muted ? '🔇' : '🔊'}
          </button>
        )}
      </div>
      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }`}</style>
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

  if (phase === 'done') {
    const allParticipants = participants ?? []
    const scores = computeScores(votes ?? [], 'final', allParticipants.map(p => p.id))
    const sorted = allParticipants.slice().sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
    const winner = sorted[0]
    const winnerFlagUrl = winner?.country ? `https://flagcdn.com/w320/${winner.country.toLowerCase()}.png` : null

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
        {winnerFlagUrl && (
          <div style={{
            position: 'absolute', inset: '-5%', zIndex: 0,
            backgroundImage: `url(${winnerFlagUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.25, filter: 'blur(16px)', transform: 'scale(1.1)',
          }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,26,0.6)', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(40px, 6vw, 80px) clamp(24px, 5vw, 60px)', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 4vw, 48px)' }}>
            <div style={{ fontSize: 'clamp(40px, 7vw, 72px)', marginBottom: '12px' }}>🏆</div>
            {winner && <div style={{ marginBottom: '12px' }}><FlagImage code={winner.country} size={56} /></div>}
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 900, marginBottom: '8px' }}>¡Evento finalizado!</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(14px, 2vw, 22px)' }}>Resultados finales — {event?.name}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
            {sorted.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: 'clamp(10px, 2vw, 18px) clamp(14px, 2.5vw, 24px)',
                background: i === 0 ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                border: `1px solid ${i === 0 ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                <span style={{ fontSize: i < 3 ? 'clamp(20px, 3vw, 32px)' : 'clamp(14px, 2vw, 20px)', minWidth: '40px', textAlign: 'center' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.2vw, 22px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FlagImage code={p.country} size={22} /> {p.groupName}
                  </div>
                  <div style={{ fontSize: 'clamp(11px, 1.5vw, 16px)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{p.song}</div>
                </div>
                <span style={{ fontWeight: 900, fontSize: 'clamp(16px, 2.5vw, 28px)', color: 'var(--color-accent)' }}>{scores[p.id] ?? 0} pts</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'clamp(13px, 1.5vw, 18px)' }}>
            ✨ Gracias por participar en {event?.name}
          </p>
        </div>
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
    return <WinnerSlide participant={participant} />
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
