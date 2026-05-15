import { useState } from 'react'
import { deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { COUNTRIES } from '../../utils/countries'
import FlagImage from '../shared/FlagImage'

function EditRow({ p, eventId, onDone }) {
  const [form, setForm] = useState({
    groupName: p.groupName ?? '',
    song: p.song ?? '',
    country: p.country ?? 'es',
    videoUrl: p.videoUrl ?? '',
    photoUrl: p.photoUrl ?? '',
  })
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'events', eventId, 'participants', p.id), {
        groupName: form.groupName.trim(),
        song: form.song.trim(),
        country: form.country,
        videoUrl: form.videoUrl.trim(),
        photoUrl: form.photoUrl.trim(),
      })
      onDone()
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCountry = COUNTRIES.find(c => c.code === form.country)

  return (
    <div className="card" style={{ padding: '14px 16px', border: '1px solid var(--color-accent)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">Grupo / Artista</label>
          <input className="input" value={form.groupName} onChange={e => set('groupName', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">Canción</label>
          <input className="input" value={form.song} onChange={e => set('song', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">País</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select className="input" value={form.country} onChange={e => set('country', e.target.value)} style={{ flex: 1 }}>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {selectedCountry && <FlagImage code={form.country} name={selectedCountry.name} size={22} />}
          </div>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label">URL vídeo</label>
          <input className="input" value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://youtu.be/..." />
        </div>
        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
          <label className="label">URL foto</label>
          <input className="input" value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : '✓ Guardar'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onDone}>Cancelar</button>
      </div>
    </div>
  )
}

export default function ParticipantList({ eventId, participants }) {
  const [editingId, setEditingId] = useState(null)
  const [savedIds, setSavedIds] = useState(new Set())

  async function handleDelete(pid) {
    if (!confirm('¿Eliminar este participante?')) return
    await deleteDoc(doc(db, 'events', eventId, 'participants', pid))
  }

  async function saveToLibrary(p) {
    await setDoc(doc(db, 'artists', p.id), {
      groupName: p.groupName,
      song: p.song,
      country: p.country ?? '',
      videoUrl: p.videoUrl ?? '',
      photoUrl: p.photoUrl ?? '',
    }, { merge: true })
    setSavedIds(s => new Set([...s, p.id]))
  }

  if (participants.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎤</div>
        <p>No hay participantes aún. ¡Añade el primero!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {participants.map((p, i) => (
        editingId === p.id
          ? <EditRow key={p.id} p={p} eventId={eventId} onDone={() => setEditingId(null)} />
          : (
            <div key={p.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700, minWidth: '24px', fontSize: '13px' }}>{i + 1}</span>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>
                {p.photoUrl
                  ? <img src={p.photoUrl} alt={p.groupName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <FlagImage code={p.country} size={28} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FlagImage code={p.country} size={18} /> {p.groupName}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                  {p.song}
                  {p.videoUrl && <span style={{ marginLeft: '8px', color: 'var(--color-primary)', fontSize: '11px' }}>▶ video</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                {p.phases?.map(ph => (
                  <span key={ph} className={`badge badge-${ph}`}>{ph}</span>
                ))}
                <button
                  className="btn btn-sm"
                  onClick={() => saveToLibrary(p)}
                  title="Guardar en biblioteca global de artistas"
                  style={savedIds.has(p.id)
                    ? { background: 'rgba(255,215,0,0.15)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }
                    : { background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.4)', color: 'var(--color-accent)' }
                  }
                >
                  {savedIds.has(p.id) ? '✓ Guardado' : '📚 Biblioteca'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(p.id)} title="Editar">✎</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)} title="Eliminar">✕</button>
              </div>
            </div>
          )
      ))}
    </div>
  )
}
