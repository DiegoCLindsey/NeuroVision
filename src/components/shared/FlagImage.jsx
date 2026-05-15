// Mapa de códigos históricos/retirados a URLs alternativas (Wikipedia Commons)
const HISTORICAL_FLAGS = {
  yu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg/320px-Flag_of_Yugoslavia_%281946-1992%29.svg.png',
  cs: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_Czechoslovakia.svg/320px-Flag_of_Czechoslovakia.svg.png',
  su: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Flag_of_the_Soviet_Union.svg/320px-Flag_of_the_Soviet_Union.svg.png',
}

export default function FlagImage({ code, name, size = 24 }) {
  if (!code) return null
  const lc = code.toLowerCase()
  if (lc === 'other') return null
  const src = HISTORICAL_FLAGS[lc] ?? `https://flagcdn.com/w80/${lc}.png`
  return (
    <img
      src={src}
      alt={name ?? code}
      style={{
        height: `${size}px`,
        width: 'auto',
        objectFit: 'contain',
        verticalAlign: 'middle',
        borderRadius: '2px',
      }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}
