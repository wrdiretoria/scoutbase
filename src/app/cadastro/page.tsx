// Server Component — tela de escolha de perfil
import Link from 'next/link'

export default function EscolhaPerfilPage() {
  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        .perfil-card {
          display: flex; flex-direction: column;
          align-items: flex-start; gap: 12px;
          width: 100%; max-width: 340px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 28px 24px;
          text-decoration: none; color: white;
          transition: border-color 0.2s, transform 0.2s, background 0.2s;
          cursor: pointer;
        }
        .perfil-card:hover {
          border-color: rgba(34,197,94,0.4);
          background: rgba(34,197,94,0.05);
          transform: translateY(-3px);
        }
        .perfil-card.atleta { border-color: rgba(34,197,94,0.2); }
        .perfil-card.atleta:hover { border-color: rgba(34,197,94,0.6); }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em', color: 'white' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
        </span>
        <p style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
          Quem é você no jogo?
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '340px' }}>

        {/* Atleta */}
        <Link href="/atleta/cadastro" className="perfil-card atleta">
          <div style={{ fontSize: '32px' }}>⚽</div>
          <div>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'white' }}>Sou atleta</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              Quero criar meu perfil, entrar no ranking e ser descoberto por scouts.
            </p>
          </div>
          <div style={{
            marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', fontWeight: 700, color: '#22c55e',
          }}>
            Criar meu perfil →
          </div>
        </Link>

        {/* Treinador */}
        <Link href="/treinador/cadastro" className="perfil-card">
          <div style={{ fontSize: '32px' }}>👨‍🏫</div>
          <div>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'white' }}>Sou treinador</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              Monte seu currículo, avalie atletas e seja encontrado por escolas.
            </p>
          </div>
          <div style={{
            marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
          }}>
            Criar meu perfil →
          </div>
        </Link>

      </div>

      {/* Já tem conta */}
      <p style={{ marginTop: '32px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
        Já tem conta?{' '}
        <Link href="/login" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>
          Entrar
        </Link>
      </p>
    </main>
  )
}