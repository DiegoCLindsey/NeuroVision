import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CreateEventForm({ user, onCreated }) {
  const [name, setName] = useState('')
  const [qualifyingTop, setQualifyingTop] = useState(10)
  const [semi1Top, setSemi1Top] = useState(5)
  const [semi2Top, setSemi2Top] = useState(5)
  const [semifinalTop, setSemifinalTop] = useState(5)
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
        config: {
          maxPerOrganizer: 3,
          qualifyTop: Number(qualifyingTop),
          qualifyingTop: Number(qualifyingTop),
          semi1Top: Number(semi1Top),
          semi2Top: Number(semi2Top),
          semifinalTop: Number(semifinalTop),
        },
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
        <input className="input" placeholder="Ej: Eurovision Amigos 2025" value={name}
          onChange={e => setName(e.target.value)} required />
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', marginTop: '8px' }}>
        Clasificados por fase (se puede cambiar después):
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">Clasificatoria → Semis</label>
          <input className="input" type="number" min={2} max={50} value={qualifyingTop}
            onChange={e => setQualifyingTop(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">Semifinal → Final</label>
          <input className="input" type="number" min={1} max={50} value={semifinalTop}
            onChange={e => setSemifinalTop(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">Semi 1 → Final</label>
          <input className="input" type="number" min={1} max={50} value={semi1Top}
            onChange={e => setSemi1Top(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">Semi 2 → Final</label>
          <input className="input" type="number" min={1} max={50} value={semi2Top}
            onChange={e => setSemi2Top(e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary btn-lg" disabled={loading}>
        {loading ? 'Creando...' : '✨ Crear evento'}
      </button>
    </form>
  )
}
