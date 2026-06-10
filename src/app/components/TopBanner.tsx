/**
 * InstitucionalBanner — faixa entre o header e o menu de categorias
 * Posição: fluxo normal da página (não fixed)
 * Altura: ~36px | Fundo escuro discreto | Texto verde da marca
 */
export default function TopBanner() {
  return (
    <div
      role="banner"
      aria-label="A vitrine dos talentos do futebol de base"
      style={{
        width: '100%',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(90deg, #080808 0%, #091209 35%, #091209 65%, #080808 100%)',
        borderTop: '1px solid rgba(0,230,118,0.10)',
        borderBottom: '1px solid rgba(0,230,118,0.10)',
        fontFamily: 'system-ui, sans-serif',
        userSelect: 'none',
      }}
    >
      <p
        style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          color: '#00e676',
          textShadow: '0 0 12px rgba(0,230,118,0.30)',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '13px', lineHeight: 1 }}>🏆</span>
        A vitrine dos talentos do futebol de base
      </p>
    </div>
  )
}
