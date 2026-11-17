export default function Loading() {
  return (
    <main
      aria-busy="true"
      style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px', color: 'var(--mc-text)' }}
    >
      <p role="status" style={{ margin: '0 0 16px', fontWeight: 700 }}>Carregando página…</p>
      <progress aria-label="Carregamento da página" style={{ width: '100%', accentColor: '#b3f737' }} />
    </main>
  )
}
