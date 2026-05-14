import { QRCodeSVG } from 'qrcode.react'

export default function QRDisplay({ url, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-block',
        background: '#fff',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-glow)',
      }}>
        <QRCodeSVG value={url} size={180} />
      </div>
      {label && <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</p>}
      <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all', maxWidth: '220px', margin: '6px auto 0' }}>{url}</p>
    </div>
  )
}
