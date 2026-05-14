export const POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]

export const PHASE_LABELS = {
  lobby: 'Sala de espera',
  qualifying: 'Clasificatoria',
  semi1: 'Semifinal 1',
  semi2: 'Semifinal 2',
  final: 'Final',
  done: 'Finalizado',
}

export const PHASE_ORDER = ['lobby', 'qualifying', 'semi1', 'semi2', 'final', 'done']

export function nextPhase(current) {
  const idx = PHASE_ORDER.indexOf(current)
  return PHASE_ORDER[idx + 1] ?? 'done'
}

export function computeScores(votes, phase, participantIds) {
  const scores = {}
  participantIds.forEach(id => { scores[id] = 0 })

  votes.forEach(vote => {
    const ballot = vote[phase] ?? []
    ballot.forEach((pid, index) => {
      if (index < POINTS.length && scores[pid] !== undefined) {
        scores[pid] += POINTS[index]
      }
    })
  })

  return scores
}

export function topParticipants(scores, n) {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([id]) => id)
}

export function countryFlag(code) {
  if (!code || code.length !== 2) return '🌍'
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E0 - 65 + c.charCodeAt(0)))
    .join('')
}

export function getVoterId() {
  let id = localStorage.getItem('nv_voter_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('nv_voter_id', id)
  }
  return id
}
