import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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

export default function AdminPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, logout } = useAuth()
  const { event, loading: eventLoading, error } = useEvent(id)
  const { participants } = useParticipants(id)
  const { votes } = useVotes(id)
  const [tab, setTab] = useState(0)

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
        <Link to={`/NeuroVision/event/${id}`} className="btn btn-primary">Ver como espectador</Link>
      </div>
    )
  }

  const spectatorUrl = `${window.location.origin}/NeuroVision/event/${id}`
  const screenUrl = `${window.location.origin}/NeuroVision/event/${id}/screen`

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
            <a href={screenUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              📺 Pantalla TV
            </a>
            <a href={spectatorUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm hide-mobile">
              👁️ Vista espectador
            </a>
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
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <PhaseControl event={event} participants={participants} votes={votes} />
            <SlideControl event={event} participants={participants} />
            <div className="card">
              <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>QR para espectadores</h3>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vista espectador (con votación)</p>
                  <QRDisplay url={spectatorUrl} label="Escanea para votar" />
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modo pantalla (TV pasiva)</p>
                  <QRDisplay url={screenUrl} label="Modo TV" />
                </div>
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
