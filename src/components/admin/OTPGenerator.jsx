import { useState, useEffect } from 'react'
import { doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'
import { db } from '../../firebase/config'

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const TTL_MIN = 10

function generateCode() {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

function buildConnectUrl(code) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}/connect?code=${code}`
}

export default function OTPGenerator({ event, user }) {
  const [code, setCode] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [secsLeft, setSecsLeft] = useState(0)
  const [loading, setLoading] = useState(false)

  // Countdown ticker
  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
      setSecsLeft(left)
      if (left === 0) { setCode(null); setExpiresAt(null) }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  // Clean up on unmount
  useEffect(() => {
    return () => { if (code) deleteDoc(doc(db, 'otps', code)).catch(() => {}) }
  }, [code])

  async function generate() {
    setLoading(true)
    try {
      if (code) await deleteDoc(doc(db, 'otps', code)).catch(() => {})
      const newCode = generateCode()
      const expires = new Date(Date.now() + TTL_MIN * 60 * 1000)
      await setDoc(doc(db, 'otps', newCode), {
        eventId: event.id,
        createdBy: user.uid,
        expiresAt: Timestamp.fromDate(expires),
      })
      setCode(newCode)
      setExpiresAt(expires.getTime())
    } finally {
      setLoading(false)
    }
  }

  async function revoke() {
    if (code) await deleteDoc(doc(db, 'otps', code)).catch(() => {})
    setCode(null)
    setExpiresAt(null)
  }

  const mins = Math.floor(secsLeft / 60)
  const secs = String(secsLeft % 60).padStart(2, '0')
  const connectUrl = code ? buildConnectUrl(code) : null
  const urgency = secsLeft < 60

  return (
    <div className="card">
      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Conectar pantalla (OTP)</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Genera un código de un solo uso para conectar la pantalla TV sin iniciar sesión.
      </p>

      {!code ? (
        <button className="btn btn-secondary" onClick={generate} disabled={loading}>
          {loading ? 'Generando...' : '📺 Generar código'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            {/* Code display */}
            <div style={{
              fontFamily: 'monospace', fontSize: 'clamp(28px, 8vw, 42px)', fontWeight: 900,
              letterSpacing: '0.15em', textAlign: 'center', padding: '16px',
              background: 'var(--bg-secondary)', borderRadius: '12px',
              border: `2px solid ${urgency ? 'var(--color-danger)' : 'var(--color-primary)'}`,
              color: urgency ? 'var(--color-danger)' : 'var(--text-primary)',
              marginBottom: '10px',
            }}>
              {code}
            </div>
            {/* Timer */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: urgency ? 'var(--color-danger)' : 'var(--text-muted)', marginBottom: '12px', fontWeight: urgency ? 700 : 400 }}>
              Expira en {mins}:{secs}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={generate} style={{ flex: 1 }}>↺ Nuevo</button>
              <button className="btn btn-danger btn-sm" onClick={revoke} style={{ flex: 1 }}>✕ Revocar</button>
            </div>
          </div>

          {/* QR */}
          {connectUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#fff', padding: '12px', borderRadius: '12px' }}>
                <QRCodeSVG value={connectUrl} size={120} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>o escanea el QR</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
