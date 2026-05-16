import { useState, useEffect, useRef } from 'react'

const starPath = 'M100,10 L121,70 L185,72 L134,111 L153,173 L100,136 L47,173 L66,111 L15,72 L79,70 Z'

const HISTORICAL_FLAGS = {
  yu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg/320px-Flag_of_Yugoslavia_%281946-1992%29.svg.png',
  cs: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_Czechoslovakia.svg/320px-Flag_of_Czechoslovakia.svg.png',
  su: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Flag_of_the_Soviet_Union.svg/320px-Flag_of_the_Soviet_Union.svg.png',
}

// Animation steps:
// 0 – hidden (waiting)
// 1 – star zooms in rotating (1.2s)
// 2 – flag fades in inside star (0.8s)
// 3 – artist name slides in from left (0.6s)
// 4 – song name slides in from left (0.6s)

export default function PresentationSlide({ participant, action }) {
  const [animStep, setAnimStep] = useState(0)
  const prevIdRef = useRef(null)

  useEffect(() => {
    if (!participant?.id) return
    if (participant.id === prevIdRef.current) return
    prevIdRef.current = participant.id

    setAnimStep(1)
    const t1 = setTimeout(() => setAnimStep(2), 1200)
    const t2 = setTimeout(() => setAnimStep(3), 2000)
    const t3 = setTimeout(() => setAnimStep(4), 2700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [participant?.id])

  const code = participant?.country?.toLowerCase()
  const flagUrl = code && code !== 'other'
    ? (HISTORICAL_FLAGS[code] ?? `https://flagcdn.com/w640/${code}.png`)
    : null
  const photoUrl = participant?.photoUrl

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.12) 0%, transparent 65%)',
        animation: animStep >= 1 ? 'pres-pulse 2.5s ease-in-out infinite' : 'none',
        opacity: animStep >= 1 ? 1 : 0,
      }} />

      {/* Star */}
      {animStep >= 1 && (
        <div style={{
          width: 'min(50vw, 50vh)',
          height: 'min(50vw, 50vh)',
          position: 'relative', zIndex: 1, flexShrink: 0,
          animation: 'star-enter 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}>
          <svg
            viewBox="0 0 200 185"
            style={{
              width: '100%', height: '100%', overflow: 'visible',
              filter: animStep === 1
                ? 'drop-shadow(0 0 50px rgba(255,215,0,1)) drop-shadow(0 0 100px rgba(255,215,0,0.6))'
                : 'drop-shadow(0 0 24px rgba(255,215,0,0.75))',
              transition: 'filter 0.8s ease',
            }}
          >
            <defs>
              <clipPath id="pres-star-clip">
                <path d={starPath} />
              </clipPath>
            </defs>

            {/* Flag / photo — fades in at step 2 */}
            <g
              clipPath="url(#pres-star-clip)"
              style={{ opacity: animStep >= 2 ? 1 : 0, transition: 'opacity 0.8s ease' }}
            >
              {photoUrl ? (
                <image href={photoUrl} x="-10" y="-10" width="220" height="205" preserveAspectRatio="xMidYMid slice" />
              ) : flagUrl ? (
                <image
                  href={flagUrl} x="0" y="0" width="200" height="185" preserveAspectRatio="xMidYMid slice"
                  style={{ animation: animStep >= 2 ? 'wave-flag 3s ease-in-out infinite' : 'none', transformOrigin: '100px 92px' }}
                />
              ) : (
                <rect x="0" y="0" width="200" height="185" fill="var(--color-secondary)" />
              )}
            </g>

            <path d={starPath} fill="none" stroke="#ffd700" strokeWidth="2.5" />
          </svg>
        </div>
      )}

      {/* Artist name — slides in from left at step 3 */}
      <div style={{
        marginTop: '28px', textAlign: 'center', zIndex: 1, position: 'relative',
        opacity: animStep >= 3 ? 1 : 0,
        transform: animStep >= 3 ? 'translateX(0)' : 'translateX(-120px)',
        transition: animStep >= 3 ? 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: 'clamp(22px, 4vw, 56px)',
          background: 'linear-gradient(135deg, #fff 30%, #ffd700)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {participant?.groupName}
        </div>
      </div>

      {/* Song name — slides in from left at step 4 */}
      <div style={{
        marginTop: '10px', textAlign: 'center', zIndex: 1, position: 'relative',
        opacity: animStep >= 4 ? 1 : 0,
        transform: animStep >= 4 ? 'translateX(0)' : 'translateX(-120px)',
        transition: animStep >= 4 ? 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
      }}>
        <div style={{ fontSize: 'clamp(15px, 2.5vw, 30px)', color: '#ffd700', fontStyle: 'italic' }}>
          "{participant?.song}"
        </div>
      </div>

      {/* Voting badge */}
      {action === 'vote' && animStep >= 4 && (
        <div style={{
          marginTop: '32px', padding: '10px 28px',
          background: 'rgba(233,69,96,0.2)', border: '2px solid #e94560',
          borderRadius: '100px', color: '#e94560', fontWeight: 800,
          fontSize: 'clamp(13px, 2vw, 20px)',
          animation: 'pres-vote-pulse 1.5s ease-in-out infinite',
          zIndex: 1, position: 'relative',
        }}>
          🗳️ ¡VOTACIÓN ABIERTA!
        </div>
      )}

      <style>{`
        @keyframes star-enter {
          0%   { transform: scale(10) rotate(720deg); opacity: 0; }
          12%  { opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pres-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes wave-flag {
          0%, 100% { transform: skewX(0deg) scaleX(1); }
          25%  { transform: skewX(-4deg) scaleX(1.03); }
          75%  { transform: skewX(4deg) scaleX(1.03); }
        }
        @keyframes pres-vote-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  )
}
