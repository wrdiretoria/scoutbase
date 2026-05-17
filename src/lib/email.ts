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
