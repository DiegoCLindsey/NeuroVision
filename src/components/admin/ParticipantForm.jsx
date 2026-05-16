import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import { saveLocalArtist } from '../../hooks/useArtists'
import { COUNTRIES } from '../../utils/countries'
import FlagImage from '../shared/FlagImage'
import ArtistLibrary from './ArtistLibrary'

const emptyForm = { groupName: '', song: '', country: 'es', videoUrl: '', photo: null }

export default function ParticipantForm({ eventId, onAdded }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showLibrary, setShowLibrary] = useState(false)

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

      const participantData = {
        groupName: form.groupName.trim(),
        song: form.song.trim(),
        country: form.country,
        photoUrl,
        videoUrl: form.videoUrl.trim(),
        phases: ['qualifying'],
        createdAt: serverTimestamp(),
      }

      // Save to event participants
      await addDoc(collection(db, 'events', eventId, 'participants'), participantData)

      // Also save to global artists library (fall back to local if no permission)
      try {
        await addDoc(collection(db, 'artists'), {
          groupName: form.groupName.trim(),
          song: form.song.trim(),
          country: form.country,
          photoUrl,
          videoUrl: form.videoUrl.trim(),
          createdAt: serverTimestamp(),
        })
      } catch {
        saveLocalArtist({
          id: crypto.randomUUID(),
          groupName: form.groupName.trim(),
          song: form.song.trim(),
          country: form.country,
          photoUrl,
          videoUrl: form.videoUrl.trim(),
          createdAt: new Date().toISOString(),
        })
      }

      setForm(emptyForm)
      onAdded?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedCountry = COUNTRIES.find(c => c.code === form.country)

  return (
    <div>
      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '16px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="input"
                value={form.country}
                onChange={e => set('country', e.target.value)}
                style={{ flex: 1 }}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              {selectedCountry && <FlagImage code={form.country} name={selectedCountry.name} size={24} />}
            </div>
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

      <div className="card" style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          onClick={() => setShowLibrary(v => !v)}
          style={{ marginBottom: showLibrary ? '16px' : 0 }}
        >
          {showLibrary ? '▲ Ocultar biblioteca' : '▼ O importar artista existente'}
        </button>
        {showLibrary && (
          <ArtistLibrary eventId={eventId} onImported={() => setShowLibrary(false)} />
        )}
      </div>
    </div>
  )
}
