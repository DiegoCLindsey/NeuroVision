import { useState } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function AdminManager({ event, user }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)

  const admins = event.admins ?? []
  const needsMigration = !event.admins && event.ownerId === user.uid

  async function migrate() {
    if (!confirm('¿Migrar este evento al nuevo sistema de admins? El propietario actual se añadirá automáticamente.')) return
    setMigrating(true)
    try {
      await updateDoc(doc(db, 'events', event.id), {
        admins: [user.email],
      })
    } finally {
      setMigrating(false)
    }
  }

  async function addAdmin(e) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || admins.includes(trimmed)) return
    setLoading(true)
    try {
      await updateDoc(doc(db, 'events', event.id), { admins: arrayUnion(trimmed) })
      setEmail('')
    } finally {
      setLoading(false)
    }
  }

  async function removeAdmin(emailToRemove) {
    if (emailToRemove === user.email && admins.length === 1) {
      alert('No puedes quitarte si eres el único admin.')
      return
    }
    if (!confirm(`¿Quitar acceso a ${emailToRemove}?`)) return
    await updateDoc(doc(db, 'events', event.id), { admins: arrayRemove(emailToRemove) })
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: '15px', marginBottom: '4px', fontWeight: 600 }}>Administradores del evento</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Todos los emails de esta lista pueden controlar el evento.
      </p>

      {needsMigration && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', marginBottom: '10px' }}>
            ⚠️ Este evento usa el sistema antiguo (un solo propietario). Migra para poder añadir más admins.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={migrate} disabled={migrating}>
            {migrating ? 'Migrando...' : '🔄 Migrar al sistema multi-admin'}
          </button>
        </div>
      )}

      {admins.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {admins.map(a => (
            <div key={a} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
              background: 'var(--bg-secondary)', borderRadius: '8px',
            }}>
              <span style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace' }}>
                {a}
                {a === user.email && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--color-accent)' }}>(tú)</span>}
              </span>
              <button
                className="btn btn-danger btn-sm btn-icon"
                onClick={() => removeAdmin(a)}
                title="Quitar acceso"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {!needsMigration && (
        <form onSubmit={addAdmin} style={{ display: 'flex', gap: '8px' }}>
          <input
            className="input"
            type="email"
            placeholder="email@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-secondary" type="submit" disabled={loading || !email.trim()}>
            {loading ? '...' : '+ Añadir'}
          </button>
        </form>
      )}
    </div>
  )
}
