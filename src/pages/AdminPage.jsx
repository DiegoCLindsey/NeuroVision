import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, updateDoc, deleteDoc, getDocs, collection, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../hooks/useAuth'
import { useEvent } from '../hooks/useEvent'
import { useParticipants } from '../hooks/useParticipants'
import { useVotes } from '../hooks/useVotes'
import Loader from '../components/shared/Loader'
import QRDisplay from '../components/shared/QRDisplay'
import ParticipantForm from '../components/admin/ParticipantForm'
import ParticipantList from '../components/admin/ParticipantList'
import PhaseControl from '../components/admin/PhaseControl'
import SlideControl from '../components/admin/SlideControl'
import ResultsView from '../components/admin/ResultsView'
import { PHASE_LABELS } from '../utils/scoring'

const TABS = ['Participantes', 'Control', 'Resultados']

function buildUrl(path) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}${path}`
}

export default function AdminPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, logout } = useAuth()
  const { event, loading: eventLoading, error } = useEvent(id)
  const { participants } = useParticipants(id)
  const { votes } = useVotes(id)
  const [tab, setTab] = useState(0)
  const [bannerSecs, setBannerSecs] = useState('')

  if (authLoading || eventLoading) return <Loader text="Cargando evento..." />

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p>Debes iniciar sesión para acceder al panel de administración.</p>
        <Link to="/" className="btn btn-primary">Ir al inicio</Link>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--color-danger)' }}>{error ?? 'Evento no encontrado.'}</p>
        <Link to="/" className="btn btn-secondary">Volver al inicio</Link>
      </div>
    )
  }

  if (event.ownerId !== user.uid) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p>No tienes permiso para administrar este evento.</p>
        <Link to={`/event/${id}`} className="btn btn-primary">Ver como espectador</Link>
      </div>
    )
  }

  const spectatorUrl = buildUrl(`/event/${id}`)
  const screenUrl = buildUrl(`/event/${id}/screen`)

  async function resetEvent() {
    if (!confirm('¿Reiniciar el evento? Se borrará el progreso y los votos, pero se conservarán los participantes.')) return
    const batch = writeBatch(db)
    const votesSnap = await getDocs(collection(db, 'events', id, 'votes'))
    votesSnap.docs.forEach(d => batch.delete(d.ref))
    batch.update(doc(db, 'events', id), { phase: 'lobby', currentSlide: null })
    await batch.commit()
  }

  async function deleteEvent() {
    if (!confirm('¿Eliminar el evento completamente? Esta acción no se puede deshacer.')) return
    const batch = writeBatch(db)
    const [pSnap, vSnap] = await Promise.all([
      getDocs(collection(db, 'events', id, 'participants')),
      getDocs(collection(db, 'events', id, 'votes')),
    ])
    pSnap.docs.forEach(d => batch.delete(d.ref))
    vSnap.docs.forEach(d => batch.delete(d.ref))
    batch.delete(doc(db, 'events', id))
    await batch.commit()
    navigate('/')
  }

  async function saveBannerSecs() {
    const secs = parseInt(bannerSecs, 10)
    if (isNaN(secs) || secs < 0) return
    await updateDoc(doc(db, 'events', id), { 'config.bannerAutoHideSecs': secs })
    setBannerSecs('')
  }

  return (
    <div className="page">
      <div className="header">
        <div className="header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/" className="logo">⭐ NV</Link>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{event.name}</div>
              <span className={`badge badge-${event.phase}`}>{PHASE_LABELS[event.phase]}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <a href={screenUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📺 TV</a>
            <a href={spectatorUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm hide-mobile">👁️ Espectador</a>
            <button className="btn btn-secondary btn-sm" onClick={logout}>Salir</button>
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={t} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      <div className="page-content">
        {tab === 0 && (
          <div>
            <ParticipantForm eventId={id} />
            <ParticipantList eventId={id} participants={participants} />

            <div className="divider" />
            <div className="card" style={{ border: '1px solid rgba(233,69,96,0.3)' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--color-danger)' }}>⚠️ Zona de peligro</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn btn-danger" onClick={resetEvent}>↺ Reiniciar progreso</button>
                <button className="btn btn-danger" onClick={deleteEvent}>🗑️ Eliminar evento</button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                Reiniciar borra votos y fases pero conserva artistas. Eliminar borra todo.
              </p>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <PhaseControl event={event} participants={participants} votes={votes} />
            <SlideControl event={event} participants={participants} votes={votes} />

            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>QR para espectadores</h3>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vista espectador</p>
                  <QRDisplay url={spectatorUrl} label="Escanea para votar" />
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modo pantalla TV</p>
                  <QRDisplay url={screenUrl} label="Modo TV" />
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Banner TV: ocultar después de (seg)</label>
                  <input
                    className="input" type="number" min="0" max="120"
                    placeholder={`Actual: ${event.config?.bannerAutoHideSecs ?? 10}s (0 = nunca)`}
                    value={bannerSecs}
                    onChange={e => setBannerSecs(e.target.value)}
                    style={{ width: '220px' }}
                  />
                </div>
                <button className="btn btn-secondary" onClick={saveBannerSecs}>Guardar</button>
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <ResultsView event={event} participants={participants} />
        )}
      </div>
    </div>
  )
}
