import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function ScreenConnect() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [code, setCode] = useState((params.get('code') ?? '').toUpperCase())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  // Auto-submit if code came from QR URL param
  useEffect(() => {
    if (params.get('code')) handleConnect(params.get('code').toUpperCase())
  }, [])

  async function handleConnect(codeToUse = code) {
    const trimmed = codeToUse.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      const ref = doc(db, 'otps', trimmed)
      const snap = await getDoc(ref)

      if (!snap.exists()) {
        setError('Código no válido.')
        setLoading(false)
        return
      }

      const data = snap.data()
      const expired = data.expiresAt?.toDate?.() < new Date()
      if (expired) {
        await deleteDoc(ref).catch(() => {})
        setError('El código ha expirado. Pide uno nuevo al administrador.')
        setLoading(false)
        return
      }

      // Consume OTP and redirect
      await deleteDoc(ref).catch(() => {})
      sessionStorage.setItem('nv_screen_ok', '1')
      navigate(`/event/${data.eventId}/screen`, { replace: true })
    } catch {
      setError('Error al verificar el código. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    handleConnect()
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px', gap: '32px',
    }}>
      <div className="stars-bg" />

      <div style={{ fontSize: '64px', position: 'relative', zIndex: 1 }}>📺</div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 900, marginBottom: '8px' }}>
          Conectar pantalla
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
          Introduce el código que aparece en el panel de administración.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '360px', position: 'relative', zIndex: 1 }}>
        <input
          ref={inputRef}
          className="input"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          placeholder="XXXXXX"
          maxLength={6}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            fontFamily: 'monospace', fontSize: '32px', fontWeight: 900,
            letterSpacing: '0.25em', textAlign: 'center',
            marginBottom: '12px', padding: '16px',
          }}
        />
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>
        )}
        <button
          className="btn btn-primary btn-lg"
          type="submit"
          style={{ width: '100%' }}
          disabled={loading || code.trim().length === 0}
        >
          {loading ? 'Conectando...' : 'Conectar →'}
        </button>
      </form>
    </div>
  )
}
