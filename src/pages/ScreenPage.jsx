import { useParams } from 'react-router-dom'
import { useEvent } from '../hooks/useEvent'
import { useParticipants } from '../hooks/useParticipants'
import ScreenSlide from '../components/screen/ScreenSlide'
import Loader from '../components/shared/Loader'

export default function ScreenPage() {
  const { id } = useParams()
  const { event, loading } = useEvent(id)
  const { participants } = useParticipants(id)

  if (loading) return <Loader text="Conectando..." />

  const currentParticipant = event?.currentSlide?.participantId
    ? participants.find(p => p.id === event.currentSlide.participantId)
    : null

  return (
    <ScreenSlide
      event={event}
      participant={currentParticipant}
      action={event?.currentSlide?.action}
    />
  )
}
