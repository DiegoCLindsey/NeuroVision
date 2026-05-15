export default function FlagImage({ code, name, size = 24 }) {
  if (!code) return null
  const lc = code.toLowerCase()
  if (lc === 'other') return null
  return (
    <img
      src={`https://flagcdn.com/w80/${lc}.png`}
      alt={name ?? code}
      style={{
        height: `${size}px`,
        width: 'auto',
        objectFit: 'contain',
        verticalAlign: 'middle',
        borderRadius: '2px',
      }}
    />
  )
}
