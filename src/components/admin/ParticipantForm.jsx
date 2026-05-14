import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'

const COUNTRIES = [
  ['ES', '🇪🇸 España'], ['FR', '🇫🇷 Francia'], ['DE', '🇩🇪 Alemania'],
  ['IT', '🇮🇹 Italia'], ['PT', '🇵🇹 Portugal'], ['GB', '🇬🇧 Reino Unido'],
  ['SE', '🇸🇪 Suecia'], ['NO', '🇳🇴 Noruega'], ['FI', '🇫🇮 Finlandia'],
  ['DK', '🇩🇰 Dinamarca'], ['NL', '🇳🇱 Países Bajos'], ['BE', '🇧🇪 Bélgica'],
  ['CH', '🇨🇭 Suiza'], ['AT', '🇦🇹 Austria'], ['GR', '🇬🇷 Grecia'],
  ['PL', '🇵🇱 Polonia'], ['UA', '🇺🇦 Ucrania'], ['RU', '🇷🇺 Rusia'],
  ['TR', '🇹🇷 Turquía'], ['IL', '🇮🇱 Israel'], ['AU', '🇦🇺 Australia'],
  ['US', '🇺🇸 Estados Unidos'], ['JP', '🇯🇵 Japón'], ['KR', '🇰🇷 Corea'],
  ['BR', '🇧🇷 Brasil'], ['MX', '🇲🇽 México'], ['AR', '🇦🇷 Argentina'],
  ['OTHER', '🌍 Otro'],
]

const emptyForm = { groupName: '', song: '', country: 'ES', videoUrl: '', photo: null }

export default function ParticipantForm({ eventId, onAdded }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.groupName.trim() || !form.song.trim()) return
    setLoading(true)
    setError('')
    try {
      let photoUrl = ''
      if (form.photo) {
        const fileRef = storageRef(storage, `events/${eventId}/participants/${Date.now()}_${form.photo.name}`)
        await uploadBytes(fileRef, form.photo)
        photoUrl = await getDownloadURL(fileRef)
      }
      await addDoc(collection(db, 'events', eventId, 'participants'), {
        groupName: form.groupName.trim(),
        song: form.song.trim(),
        country: form.country,
        photoUrl,
        videoUrl: form.videoUrl.trim(),
        phases: ['qualifying'],
        createdAt: serverTimestamp(),
      })
      setForm(emptyForm)
      onAdded?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Añadir participante</h3>
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">Grupo / Artista *</label>
          <input className="input" placeholder="Nombre del grupo" value={form.groupName} onChange={e => set('groupName', e.target.value)} required />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">Canción *</label>
          <input className="input" placeholder="Título de la canción" value={form.song} onChange={e => set('song', e.target.value)} required />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">País</label>
          <select className="input" value={form.country} onChange={e => set('country', e.target.value)}>
            {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">URL del videoclip (YouTube)</label>
          <input className="input" placeholder="https://youtu.be/..." value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
          <label className="label">Foto del artista</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => set('photo', e.target.files[0] ?? null)}
            style={{ color: 'var(--text-secondary)', fontSize: '13px' }}
          />
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Subiendo...' : '+ Añadir participante'}
        </button>
      </div>
    </form>
  )
}
