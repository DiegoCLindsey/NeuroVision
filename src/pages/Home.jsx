import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'
import CreateEventForm from '../components/admin/CreateEventForm'

export default function Home() {
  const { user, signInWithGoogle, logout, loading } = useAuth()
  const navigate = useNavigate()
  const [joinId, setJoinId] = useState('')
  const [joinError, setJoinError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [myEvents, setMyEvents] = useState(null)

  useEffect(() => {
    setMyEvents(null)
    if (user) loadMyEvents(user.uid, user.email)
  }, [user?.uid])

  async function loadMyEvents(uid, email) {
    const [ownerSnap, adminSnap] = await Promise.all([
      getDocs(query(collection(db, 'events'), where('ownerId', '==', uid))),
      email ? getDocs(query(collection(db, 'events'), where('admins', 'array-contains', email))) : Promise.resolve({ docs: [] }),
    ])
    const seen = new Set()
    const events = []
    for (const snap of [ownerSnap, adminSnap]) {
      for (const d of snap.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id)
          events.push({ id: d.id, ...d.data() })
        }
      }
    }
    setMyEvents(events)
  }

  async function handleSignIn() {
    try {
      await signInWithGoogle()
    } catch {
      // user closed popup
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    const id = joinId.trim()
    if (!id) return
    setJoinError('')
    const snap = await getDoc(doc(db, 'events', id))
    if (!snap.exists()) {
      setJoinError('Evento no encontrado. Verifica el código.')
      return
    }
    navigate(`/event/${id}`)
  }

  function handleCreated(id) {
    navigate(`/event/${id}/admin`)
  }

  if (loading) return null

  return (
    <div className="page">
      <div className="stars-bg" />
      <div className="header">
        <div className="header-inner">
          <span className="logo">⭐ NeuroVision</span>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={user.photoURL} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }} className="hide-mobile">{user.displayName}</span>
              <button className="btn btn-secondary btn-sm" onClick={logout}>Salir</button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={handleSignIn}>
              <GoogleIcon /> Iniciar sesión
            </button>
          )}
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: '60px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{
            fontSize: 'clamp(36px, 8vw, 80px)', fontWeight: 900, lineHeight: 1,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '20px',
          }}>
            NeuroVision
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto' }}>
            Tu festival Eurovision entre amigos. Votad en tiempo real con el móvil. 🎤
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '720px', margin: '0 auto' }}>
          {/* Join event */}
          <div className="card" style={{ border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📱</div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Unirse a un evento</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Introduce el código o escanea el QR que te ha dado el organizador.
            </p>
            <form onSubmit={handleJoin} style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                placeholder="Código del evento"
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">Entrar</button>
            </form>
            {joinError && <div className="alert alert-error" style={{ marginTop: '12px', marginBottom: 0 }}>{joinError}</div>}
          </div>

          {/* Create event */}
          <div className="card" style={{ border: '1px solid rgba(255, 215, 0, 0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏆</div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Organizar un evento</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Crea un festival para tus amigos. Añade participantes y controla las fases.
            </p>
            {user ? (
              <button className="btn btn-accent" onClick={() => setShowCreate(s => !s)}>
                {showCreate ? 'Cancelar' : '✨ Crear evento'}
              </button>
            ) : (
              <button className="btn btn-accent" onClick={handleSignIn}>
                <GoogleIcon /> Iniciar sesión para crear
              </button>
            )}
          </div>
        </div>

        {/* Create event form */}
        {showCreate && user && (
          <div style={{ maxWidth: '560px', margin: '32px auto 0' }}>
            <CreateEventForm user={user} onCreated={handleCreated} />
          </div>
        )}

        {/* My events */}
        {user && !showCreate && (
          <div style={{ maxWidth: '720px', margin: '40px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>Mis eventos</h3>
              {!myEvents && (
                <button className="btn btn-secondary btn-sm" onClick={() => loadMyEvents(user.uid, user.email)}>↺</button>
              )}
            </div>
            {myEvents && (
              myEvents.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No tienes eventos aún.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {myEvents.map(ev => (
                      <div key={ev.id} className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{ev.name}</div>
                          <span className={`badge badge-${ev.phase}`} style={{ marginTop: '4px' }}>{ev.phase}</span>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/event/${ev.id}/admin`)}>
                          Administrar →
                        </button>
                      </div>
                    ))}
                  </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
