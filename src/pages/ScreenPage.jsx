import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useEvent } from '../hooks/useEvent'
import { useParticipants } from '../hooks/useParticipants'
import { useVotes } from '../hooks/useVotes'
import ScreenSlide from '../components/screen/ScreenSlide'
import Loader from '../components/shared/Loader'

export default function ScreenPage() {
  const { id } = useParams()
  const { event, loading } = useEvent(id)
  const { participants } = useParticipants(id)
  const { votes } = useVotes(id)
  const [activated, setActivated] = useState(() => sessionStorage.getItem('nv_screen_ok') === '1')

  function activate() {
    sessionStorage.setItem('nv_screen_ok', '1')
    setActivated(true)
  }

  if (loading) return <Loader text="Conectando..." />

  const currentParticipant = event?.currentSlide?.participantId
    ? participants.find(p => p.id === event.currentSlide.participantId)
    : null

  return (
    <div style={{ position: 'relative' }}>
      {!activated && (
        <div
          onClick={activate}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', gap: '20px',
          }}
        >
          <div style={{ fontSize: '80px' }}>▶</div>
          <p style={{ color: '#fff', fontSize: '24px', fontWeight: 700 }}>Haz clic para activar la pantalla</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Necesario para la reproducción automática de vídeos</p>
        </div>
      )}
      <ScreenSlide
        event={event}
        participant={currentParticipant}
        action={event?.currentSlide?.action}
        participants={participants}
        votes={votes}
      />
    </div>
  )
}
