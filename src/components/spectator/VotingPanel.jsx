import { useState, useEffect } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { POINTS, getVoterId } from '../../utils/scoring'
import FlagImage from '../shared/FlagImage'

export default function VotingPanel({ eventId, phase, participants, existingVote }) {
  const [ballot, setBallot] = useState(existingVote ?? [])
  const [submitted, setSubmitted] = useState(!!existingVote?.length)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (existingVote?.length) {
      setBallot(existingVote)
      setSubmitted(true)
    }
  }, [existingVote])

  function toggleParticipant(pid) {
    if (submitted) return
    setBallot(prev => {
      if (prev.includes(pid)) return prev.filter(p => p !== pid)
      if (prev.length >= POINTS.length) return prev
      return [...prev, pid]
    })
  }

  function moveUp(idx) {
    setBallot(prev => {
      if (idx === 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  function moveDown(idx) {
    setBallot(prev => {
      if (idx === prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  async function submitVote() {
    if (ballot.length === 0) return
    setLoading(true)
    try {
      const voterId = getVoterId()
      await setDoc(
        doc(db, 'events', eventId, 'votes', voterId),
        {
          [phase]: ballot,
          voterName: localStorage.getItem('nv_voter_name') ?? 'Anónimo',
        },
        { merge: true }
      )
      setSubmitted(true)
    } catch (err) {
      alert('Error al votar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function editVote() { setSubmitted(false) }

  const available = participants.filter(p => !ballot.includes(p.id))
  const isFull = ballot.length >= POINTS.length

  if (submitted) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌟</div>
        <h3 style={{ marginBottom: '8px' }}>¡Voto enviado!</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
          Has votado por {ballot.length} participante(s)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px', textAlign: 'left' }}>
          {ballot.map((pid, i) => {
            const p = participants.find(x => x.id === pid)
            return p ? (
              <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--color-accent)', fontWeight: 800, minWidth: '32px' }}>{POINTS[i]} pts</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FlagImage code={p.country} size={18} /> {p.groupName}</span>
              </div>
            ) : null
          })}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={editVote}>Modificar voto</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px' }}>Tu voto</h3>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{ballot.length}/{POINTS.length} seleccionados</span>
      </div>
      {ballot.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', background: 'var(--bg-secondary)' }}>
          <p className="label" style={{ marginBottom: '10px' }}>Tu clasificación</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ballot.map((pid, i) => {
              const p = participants.find(x => x.id === pid)
              if (!p) return null
              return (
                <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 800, minWidth: '36px', fontSize: '14px' }}>{POINTS[i]} pts</span>
                  <span style={{ flex: 1, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><FlagImage code={p.country} size={16} /> {p.groupName}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => moveDown(i)} disabled={i === ballot.length - 1}>↓</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => toggleParticipant(pid)}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Submit button floats up right below ballot when full */}
      {isFull && (
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginBottom: '20px' }}
          onClick={submitVote}
          disabled={loading}
        >
          {loading ? 'Enviando...' : `🗳️ Enviar voto (${ballot.length} participante${ballot.length !== 1 ? 's' : ''})`}
        </button>
      )}

      <div style={{ marginBottom: '20px' }}>
        <p className="label" style={{ marginBottom: '10px' }}>
          {isFull ? 'Máximo alcanzado — quita uno para cambiar' : 'Haz clic para añadir'}
        </p>
        <div className="grid-3">
          {available.map(p => (
            <button
              key={p.id}
              className="btn btn-secondary"
              style={{ flexDirection: 'column', height: 'auto', padding: '14px 10px', textAlign: 'center', gap: '8px', opacity: isFull ? 0.35 : 1 }}
              onClick={() => toggleParticipant(p.id)}
              disabled={isFull}
            >
              {p.photoUrl
                ? <img src={p.photoUrl} alt={p.groupName} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                : <FlagImage code={p.country} size={32} />
              }
              <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>{p.groupName}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{p.song}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit button at bottom when not full */}
      {!isFull && (
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={submitVote}
          disabled={ballot.length === 0 || loading}
        >
          {loading ? 'Enviando...' : `🗳️ Enviar voto (${ballot.length} participante${ballot.length !== 1 ? 's' : ''})`}
        </button>
      )}
    </div>
  )
}
