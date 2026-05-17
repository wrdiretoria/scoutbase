/**
 * Email helper usando Resend API (https://resend.com — free tier 3k emails/mês)
 * Se RESEND_API_KEY não estiver configurada, falha silenciosamente.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL     = process.env.EMAIL_FROM ?? 'Meu Craque <noreply@meucraque.com.br>'

interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_API_KEY) {
    // Sem key configurada — log e segue. Avaliação não pode falhar por causa de email.
    console.warn('[email] RESEND_API_KEY não configurada — email não enviado.')
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[email] Resend erro:', err)
    }
  } catch (err) {
    console.error('[email] Falha ao enviar:', err)
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

interface ResumSemanalParams {
  atletaNome:    string
  atletaId:      string   // auth UUID
  visitCount:    number
  favoritoCount: number
  ovr:           number | null
  proximoPasso:  string   // sugestão personalizada
}

export function emailResumSemanal(p: ResumSemanalParams): string {
  const perfilUrl = `https://meucraque.com.br/jogador/${p.atletaId}`
  const meuPerfilUrl = `https://meucraque.com.br/atleta/perfil`
  const ovrColor = p.ovr
    ? (p.ovr >= 80 ? '#22c55e' : p.ovr >= 60 ? '#f59e0b' : '#94a3b8')
    : '#94a3b8'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:500px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#030c05,#0a1a0c);padding:28px 32px;text-align:center;">
      <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:6px;">
        Resumo da semana
      </div>
      <div style="font-size:20px;font-weight:900;color:white;">
        ⚽ MEU <span style="color:#22c55e;">CRAQUE</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:900;color:#111;">
        E aí, ${p.atletaNome.split(' ')[0]}! 👋
      </h1>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
        Veja como foi o seu perfil esta semana no Meu Craque.
      </p>

      <!-- Stats -->
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#15803d;line-height:1;">${p.visitCount.toLocaleString('pt-BR')}</div>
          <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">visitas no perfil</div>
        </div>
        <div style="flex:1;background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#d97706;line-height:1;">${p.favoritoCount > 0 ? p.favoritoCount : '—'}</div>
          <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">scouts te salvaram</div>
        </div>
        <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;text-align:center;">
          <div style="font-size:32px;font-weight:900;color:${ovrColor};line-height:1;">${p.ovr ?? '—'}</div>
          <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;">OVR atual</div>
        </div>
      </div>

      <!-- Próximo passo -->
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin-bottom:24px;display:flex;gap:12px;align-items:flex-start;">
        <div style="font-size:22px;flex-shrink:0;">💡</div>
        <div>
          <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#111;">Próximo passo</p>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">${p.proximoPasso}</p>
        </div>
      </div>

      <!-- CTAs -->
      <a href="${meuPerfilUrl}" style="display:block;background:#22c55e;color:white;text-align:center;padding:14px;border-radius:12px;font-weight:900;font-size:15px;text-decoration:none;margin-bottom:10px;">
        Ver meu perfil →
      </a>
      <a href="${perfilUrl}" style="display:block;background:#f0fdf4;color:#15803d;text-align:center;padding:12px;border-radius:12px;font-weight:700;font-size:13px;text-decoration:none;border:1px solid #bbf7d0;">
        🔗 Compartilhar meu perfil público
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
        Meu Craque · O futebol começa aqui<br>
        <a href="https://meucraque.com.br" style="color:#22c55e;text-decoration:none;">meucraque.com.br</a>
        &nbsp;·&nbsp;
        <a href="${meuPerfilUrl}" style="color:#9ca3af;text-decoration:none;">Desativar emails</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}


// ── Email: Scout salvou você como favorito ────────────────────────────────────

interface FavoritoEmailParams {
  atletaNome:   string
  scoutNome:    string
  atletaId:     string
}

export function emailScoutFavoritou(p: FavoritoEmailParams): string {
  const perfilUrl = `https://meucraque.com.br/jogador/${p.atletaId}`
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fffbeb;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#030c05,#0a1a0c);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">⭐</div>
      <div style="font-size:22px;font-weight:900;color:white;">
        MEU <span style="color:#22c55e;">CRAQUE</span>
      </div>
    </div>

    <div style="padding:32px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#111;">
        Um scout te adicionou aos favoritos!
      </h1>
      <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
        Olá, <strong>${p.atletaNome.split(' ')[0]}</strong>! O scout <strong>${p.scoutNome}</strong> acabou de salvar seu perfil como favorito. Isso significa que ele está te acompanhando de perto. 👀
      </p>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:36px;margin-bottom:8px;">🔍</div>
        <p style="margin:0;font-size:14px;color:#92400e;font-weight:700;">
          Mantenha seu perfil atualizado.<br>Scouts buscam atletas completos.
        </p>
      </div>

      <a href="${perfilUrl}" style="display:block;background:#22c55e;color:white;text-align:center;padding:16px;border-radius:14px;font-weight:900;font-size:16px;text-decoration:none;margin-bottom:12px;">
        Ver meu perfil →
      </a>
      <a href="https://meucraque.com.br/atleta/promover" style="display:block;background:#f0fdf4;color:#15803d;text-align:center;padding:13px;border-radius:14px;font-weight:700;font-size:14px;text-decoration:none;border:1px solid #bbf7d0;">
        🚀 Aparecer em destaque para mais scouts
      </a>
    </div>

    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Meu Craque · <a href="https://meucraque.com.br" style="color:#22c55e;text-decoration:none;">meucraque.com.br</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

interface AvaliacaoEmailParams {
  atletaNome: string
  atletaEmail: string
  treinadorNome: string
  notaGeral: number       // 0–100
  velocidade: number      // 1–10
  forca: number
  finalizacao: number
  visao: number
  posicionamento: number
  tecnica: number
  observacao?: string | null
  atletaId: string        // auth UUID para link do perfil
}

export function emailAvaliacaoRecebida(p: AvaliacaoEmailParams): string {
  const notaColor = p.notaGeral >= 80 ? '#22c55e' : p.notaGeral >= 60 ? '#f59e0b' : '#ef4444'
  const perfilUrl = `https://meucraque.com.br/jogador/${p.atletaId}`

  const atributos = [
    { label: 'Velocidade',     valor: p.velocidade },
    { label: 'Força',          valor: p.forca },
    { label: 'Finalização',    valor: p.finalizacao },
    { label: 'Visão de jogo',  valor: p.visao },
    { label: 'Posicionamento', valor: p.posicionamento },
    { label: 'Técnica',        valor: p.tecnica },
  ]

  const atributosHtml = atributos.map(a => `
    <tr>
      <td style="padding:8px 0;color:#666;font-size:14px;">${a.label}</td>
      <td style="padding:8px 0;text-align:right;">
        <span style="background:#f0fdf4;color:#15803d;font-weight:800;padding:3px 10px;border-radius:20px;font-size:13px;">
          ${a.valor}/10
        </span>
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#030c05,#0a1a0c);padding:32px 32px 28px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">⚽</div>
      <div style="font-size:22px;font-weight:900;color:white;letter-spacing:0.03em;">
        MEU <span style="color:#22c55e;">CRAQUE</span>
      </div>
      <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:4px 0 0;letter-spacing:0.1em;text-transform:uppercase;">
        Perfil Oficial de Atleta
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#111;">
        🏆 Você foi avaliado!
      </h1>
      <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
        Olá, <strong>${p.atletaNome}</strong>! O treinador <strong>${p.treinadorNome}</strong> acabou de registrar uma avaliação oficial no seu perfil.
      </p>

      <!-- OVR destaque -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#15803d;letter-spacing:0.12em;text-transform:uppercase;">
          Nota Geral
        </p>
        <div style="font-size:64px;font-weight:900;color:${notaColor};line-height:1;">
          ${p.notaGeral}
        </div>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">de 100 pontos</p>
      </div>

      <!-- Atributos -->
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:800;color:#111;">Atributos avaliados</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${atributosHtml}
      </table>

      ${p.observacao ? `
      <!-- Observação -->
      <div style="background:#fafafa;border-left:3px solid #22c55e;border-radius:0 12px 12px 0;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#15803d;letter-spacing:0.1em;text-transform:uppercase;">Observação do treinador</p>
        <p style="margin:0;font-size:14px;color:#444;line-height:1.6;font-style:italic;">"${p.observacao}"</p>
      </div>
      ` : ''}

      <!-- CTA -->
      <a href="${perfilUrl}" style="display:block;background:#22c55e;color:white;text-align:center;padding:16px;border-radius:14px;font-weight:900;font-size:16px;text-decoration:none;margin-bottom:16px;">
        Ver meu perfil completo →
      </a>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Ou acesse: <a href="${perfilUrl}" style="color:#22c55e;">${perfilUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        Meu Craque · Plataforma de perfis de atletas<br>
        <a href="https://meucraque.com.br" style="color:#22c55e;text-decoration:none;">meucraque.com.br</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
