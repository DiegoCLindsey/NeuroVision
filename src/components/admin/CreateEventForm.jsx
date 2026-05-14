import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CreateEventForm({ user, onCreated }) {
  const [name, setName] = useState('')
  const [qualifyTop, setQualifyTop] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const ref = await addDoc(collection(db, 'events'), {
        name: name.trim(),
        slug: toSlug(name),
        createdAt: serverTimestamp(),
        ownerId: user.uid,
        config: { maxPerOrganizer: 3, qualifyTop: Number(qualifyTop) },
        phase: 'lobby',
        currentSlide: null,
      })
      onCreated(ref.id)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Crear nuevo evento</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group">
        <label className="label">Nombre del evento</label>
        <input
          className="input"
          placeholder="Ej: Eurovision Amigos 2025"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label className="label">Clasificados para la final (top N)</label>
        <input
          className="input"
          type="number"
          min={2}
          max={50}
          value={qualifyTop}
          onChange={e => setQualifyTop(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-lg" disabled={loading}>
        {loading ? 'Creando...' : '✨ Crear evento'}
      </button>
    </form>
  )
}
