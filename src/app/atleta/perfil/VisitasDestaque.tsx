/**
 * Contador de visitas grande e destacado no topo do perfil do atleta.
 * Dados de /api/atleta/visitas (total, semana, média da plataforma na semana).
 */
export default function VisitasDestaque({ total, semana, mediaSemana }: {
  total: number
  semana: number
  mediaSemana: number
}) {
  const acimaDaMedia = semana > 0 && mediaSemana > 0 && semana >= mediaSemana
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '18px 20px', borderRadius: '18px', marginBottom: '16px',
      background: 'linear-gradient(135deg,rgba(96,165,250,0.12),rgba(0,230,118,0.06))',
      border: '1px solid rgba(96,165,250,0.25)',
    }}>
      <span style={{ fontSize: '34px', lineHeight: 1, flexShrink: 0 }}>👁</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '40px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: 'white', fontVariantNumeric: 'tabular-nums' }}>
          {total.toLocaleString('pt-BR')}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {total === 1 ? 'visita no seu perfil' : 'visitas no seu perfil'}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: semana > 0 ? '#00e676' : 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
          +{semana}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
          esta semana
        </p>
        {acimaDaMedia && (
          <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: 800, color: '#fbbf24' }}>🔥 acima da média</p>
        )}
      </div>
    </div>
  )
}

