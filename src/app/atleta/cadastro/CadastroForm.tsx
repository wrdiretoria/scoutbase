'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const posicoes = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Meia-Atacante',
  'Ponta Direita', 'Ponta Esquerda', 'Atacante', 'Centro-Avante',
]

const ESTADOS_BR = [
  'Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal',
  'Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul',
  'Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí',
  'Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia',
  'Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins',
]

const CIDADES_BR: Record<string, string[]> = {
  'Acre': ['Rio Branco','Cruzeiro do Sul','Sena Madureira','Tarauacá','Feijó','Brasileia'],
  'Alagoas': ['Maceió','Arapiraca','Palmeira dos Índios','Rio Largo','Penedo','União dos Palmares','São Miguel dos Campos','Delmiro Gouveia'],
  'Amapá': ['Macapá','Santana','Laranjal do Jari','Oiapoque','Mazagão'],
  'Amazonas': ['Manaus','Parintins','Itacoatiara','Manacapuru','Coari','Tefé','Tabatinga','Maués'],
  'Bahia': ['Salvador','Feira de Santana','Vitória da Conquista','Camaçari','Juazeiro','Ilhéus','Itabuna','Lauro de Freitas','Barreiras','Jequié','Teixeira de Freitas','Alagoinhas','Porto Seguro','Paulo Afonso','Simões Filho','Eunápolis'],
  'Ceará': ['Fortaleza','Caucaia','Juazeiro do Norte','Maracanaú','Sobral','Crato','Itapipoca','Maranguape','Iguatu','Quixadá','Pacatuba','Russas','Aquiraz'],
  'Distrito Federal': ['Brasília','Ceilândia','Taguatinga','Samambaia','Planaltina','Águas Claras','Sobradinho','Recanto das Emas','Gama','Santa Maria','São Sebastião','Guará'],
  'Espírito Santo': ['Vitória','Serra','Vila Velha','Cariacica','Linhares','São Mateus','Cachoeiro de Itapemirim','Colatina','Guarapari','Aracruz'],
  'Goiás': ['Goiânia','Aparecida de Goiânia','Anápolis','Rio Verde','Luziânia','Águas Lindas de Goiás','Valparaíso de Goiás','Trindade','Formosa','Novo Gama','Itumbiara','Senador Canedo','Catalão','Jataí'],
  'Maranhão': ['São Luís','Imperatriz','São José de Ribamar','Timon','Caxias','Codó','Paço do Lumiar','Açailândia','Bacabal','Balsas'],
  'Mato Grosso': ['Cuiabá','Várzea Grande','Rondonópolis','Sinop','Tangará da Serra','Cáceres','Sorriso','Lucas do Rio Verde','Primavera do Leste','Barra do Garças'],
  'Mato Grosso do Sul': ['Campo Grande','Dourados','Três Lagoas','Corumbá','Grande Dourados','Ponta Porã','Naviraí','Nova Andradina','Aquidauana','Sidrolândia'],
  'Minas Gerais': ['Belo Horizonte','Uberlândia','Contagem','Juiz de Fora','Betim','Montes Claros','Ribeirão das Neves','Uberaba','Governador Valadares','Ipatinga','Sete Lagoas','Divinópolis','Santa Luzia','Ibirité','Poços de Caldas','Patos de Minas','Pouso Alegre','Barbacena','Sabará','Vespasiano'],
  'Pará': ['Belém','Ananindeua','Santarém','Marabá','Parauapebas','Castanhal','Abaetetuba','Cametá','Altamira','Itaituba','Tucuruí','Marituba'],
  'Paraíba': ['João Pessoa','Campina Grande','Santa Rita','Patos','Bayeux','Sousa','Cajazeiras','Cabedelo','Guarabira'],
  'Paraná': ['Curitiba','Londrina','Maringá','Ponta Grossa','Cascavel','São José dos Pinhais','Foz do Iguaçu','Colombo','Guarapuava','Paranaguá','Araucária','Toledo','Apucarana','Pinhais','Campo Largo','Almirante Tamandaré','Umuarama'],
  'Pernambuco': ['Recife','Caruaru','Olinda','Petrolina','Paulista','Jaboatão dos Guararapes','Boa Viagem','Garanhuns','Vitória de Santo Antão','Serra Talhada','Cabo de Santo Agostinho','Camaragibe','Abreu e Lima'],
  'Piauí': ['Teresina','Parnaíba','Picos','Piripiri','Floriano','Campo Maior'],
  'Rio de Janeiro': ['Rio de Janeiro','São Gonçalo','Duque de Caxias','Nova Iguaçu','Niterói','Belford Roxo','Campos dos Goytacazes','São João de Meriti','Macaé','Volta Redonda','Petrópolis','Magé','Itaboraí','Cabo Frio','Angra dos Reis','Mesquita','Nilópolis','Teresópolis','Queimados','Resende'],
  'Rio Grande do Norte': ['Natal','Mossoró','Parnamirim','São Gonçalo do Amarante','Macaíba','Ceará-Mirim','Caicó','Assu','Currais Novos'],
  'Rio Grande do Sul': ['Porto Alegre','Caxias do Sul','Pelotas','Canoas','Santa Maria','Gravataí','Viamão','Novo Hamburgo','São Leopoldo','Rio Grande','Alvorada','Passo Fundo','Sapucaia do Sul','Uruguaiana','Santa Cruz do Sul','Cachoeirinha','Bagé','Bento Gonçalves','Erechim','Guaíba'],
  'Rondônia': ['Porto Velho','Ji-Paraná','Ariquemes','Vilhena','Cacoal','Rolim de Moura','Jaru','Guajará-Mirim'],
  'Roraima': ['Boa Vista','Rorainópolis','Caracaraí'],
  'Santa Catarina': ['Florianópolis','Joinville','Blumenau','São José','Chapecó','Itajaí','Lages','Criciúma','Caçador','Jaraguá do Sul','Palhoça','Balneário Camboriú','Brusque','Tubarão','São Bento do Sul'],
  'São Paulo': ['São Paulo','Guarulhos','Campinas','São Bernardo do Campo','Santo André','Osasco','São José dos Campos','Ribeirão Preto','Sorocaba','Mauá','Santos','Mogi das Cruzes','Diadema','Jundiaí','Carapicuíba','Piracicaba','Barueri','Itaquaquecetuba','São Vicente','Franca','Guarujá','Taubaté','Praia Grande','Limeira','Suzano','Taboão da Serra','Sumaré','Bauru','Indaiatuba','Embu das Artes','São Carlos','Araraquara','Marília','Cotia','Americana'],
  'Sergipe': ['Aracaju','Nossa Senhora do Socorro','Lagarto','Itabaiana','São Cristóvão','Estância','Tobias Barreto'],
  'Tocantins': ['Palmas','Araguaína','Gurupi','Porto Nacional','Paraíso do Tocantins','Colinas do Tocantins'],
}

const CIDADES_INTL: Record<string, string[]> = {
  'Argentina': ['Buenos Aires','Córdoba','Rosario','Mendoza','La Plata','San Miguel de Tucumán','Mar del Plata','Salta','Santa Fe','San Juan'],
  'Paraguai': ['Assunção','Ciudad del Este','San Lorenzo','Luque','Capiatá','Lambaré','Fernando de la Mora','Limpio','Mariano Roque Alonso','Pedro Juan Caballero','Encarnación','Concepción'],
  'Uruguai': ['Montevidéu','Salto','Paysandú','Las Piedras','Rivera','Maldonado','Tacuarembó'],
  'Bolívia': ['Santa Cruz de la Sierra','La Paz','Cochabamba','Oruro','Sucre','Potosí','Tarija','Trinidad'],
  'Chile': ['Santiago','Antofagasta','Valparaíso','Concepción','La Serena','Arica','Talca','Temuco','Iquique','Rancagua'],
  'Colômbia': ['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Cúcuta','Bucaramanga','Pereira','Santa Marta','Ibagué'],
  'Equador': ['Guayaquil','Quito','Cuenca','Manta','Portoviejo','Machala','Durán','Esmeraldas','Ambato'],
  'Peru': ['Lima','Arequipa','Trujillo','Chiclayo','Piura','Iquitos','Cusco','Huancayo','Tacna'],
  'Venezuela': ['Caracas','Maracaibo','Valencia','Barquisimeto','Maracay','Ciudad Guayana','San Cristóbal'],
  'Portugal': ['Lisboa','Porto','Amadora','Braga','Setúbal','Coimbra','Funchal','Almada','Aveiro','Guimarães'],
  'Espanha': ['Madrid','Barcelona','Valencia','Sevilha','Zaragoza','Málaga','Múrcia','Palma','Las Palmas','Bilbao'],
  'França': ['Paris','Marselha','Lyon','Toulouse','Nice','Nantes','Montpellier','Strasbourg','Bordeaux','Lille'],
  'Itália': ['Roma','Milão','Nápoles','Turim','Palermo','Génova','Bolonha','Florença','Veneza','Bari'],
  'Alemanha': ['Berlim','Hamburgo','Munique','Colônia','Frankfurt','Stuttgart','Düsseldorf','Dortmund','Essen','Leipzig'],
  'Inglaterra': ['Londres','Birmingham','Leeds','Glasgow','Sheffield','Bradford','Liverpool','Edinburgh','Manchester','Bristol'],
  'Estados Unidos': ['Nova York','Los Angeles','Chicago','Houston','Phoenix','Filadélfia','San Antonio','San Diego','Dallas','Miami','Atlanta','Orlando'],
  'México': ['Cidade do México','Guadalajara','Monterrey','Puebla','Tijuana','Toluca','León','Ciudad Juárez','Mérida','San Luis Potosí'],
}

type Props = {
  escolaId:  string | null
  escolaNome: string | null
  refCode:   string | null
}

/** Comprime a imagem para JPEG no browser antes do upload (~300 KB max) */
async function compressImage(file: File, maxPx = 900, quality = 0.82): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const w = Math.round(img.width  * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        blob => resolve(blob ?? file),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

export default function CadastroForm({ escolaId, escolaNome, refCode }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [nome, setNome] = useState('')
  const [posicao, setPosicao] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [pais,   setPais]   = useState('Brasil')
  const [dataNasc, setDataNasc] = useState('')
  const [sexo, setSexo] = useState<'Masculino' | 'Feminino' | ''>('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (!password || password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (!recoveryEmail.trim()) {
      setError('Informe um email de recuperação.')
      return
    }
    if (!consent) {
      setError('Confirme o consentimento para continuar.')
      return
    }
    setError(null)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome || !posicao || !cidade || !dataNasc || !sexo) {
      setError('Preencha todos os campos.')
      return
    }

    // Validação de idade — perfil de atleta até Sub-20 (20 anos)
    const nascimento = new Date(dataNasc)
    const hoje = new Date()
    const idade = hoje.getFullYear() - nascimento.getFullYear() -
      (hoje < new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate()) ? 1 : 0)
    if (idade > 20) {
      setError('⚠️ O Meu Craque é exclusivo para atletas do futebol de base (até Sub-20). Se você é treinador ou profissional, crie um perfil de treinador.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      // 1. Gerar ID único antes do signUp
      const idRes = await fetch('/api/atleta/gerar-id', { method: 'POST' })
      if (!idRes.ok) throw new Error('Não foi possível gerar seu ID. Verifique sua conexão.')
      const idJson = await idRes.json() as { athleteId?: string; error?: string }
      if (!idJson.athleteId) throw new Error(idJson.error ?? 'ID não gerado. Tente novamente.')
      const athleteId = idJson.athleteId

      // 2. Criar conta com email interno baseado no ID
      const internalEmail = `${athleteId.toLowerCase()}@meucraque.app`
      const supabase = createClient()
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: internalEmail,
        password,
        options: {
          data: { nome, posicao, sexo, cidade, estado: estado || undefined, pais, tipo: 'atleta' },
        },
      })

      if (signUpErr) {
        console.error('[cadastro-atleta] signUp:', signUpErr.message, signUpErr.status)
        const m = signUpErr.message.toLowerCase()
        if (m.includes('rate limit') || m.includes('email rate limit')) {
          throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
        }
        throw new Error('Não foi possível criar a conta. Verifique sua conexão e tente novamente.')
      }
      if (!data.user) throw new Error('Conta não criada. Tente novamente.')

      const userId = data.user.id

      // 3. Registrar indicação se houver código de referência
      if (refCode) {
        try {
          await fetch('/api/indicacao/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refCode, newUserId: userId }),
          })
        } catch { /* indicação falhou — não bloqueia */ }
      }

      // 4. Upload da foto via API (admin client — sem RLS)
      let avatarUrl: string | null = null
      if (photo) {
        try {
          // Comprime no browser → JPEG garantido, sem problemas de HEIC ou tamanho
          const compressed = await compressImage(photo)
          const fd = new FormData()
          fd.append('file', new File([compressed], 'photo.jpg', { type: 'image/jpeg' }))
          if (!data.session?.access_token) throw new Error('sem sessão')
          const uploadRes = await fetch('/api/atleta/upload-foto-cadastro', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${data.session.access_token}` },
            body: fd,
          })
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json() as { url?: string }
            avatarUrl = uploadJson.url ?? null
          } else {
            console.warn('[cadastro-atleta] foto não salva:', await uploadRes.text())
          }
        } catch (uploadErr) {
          console.warn('[cadastro-atleta] foto não salva:', uploadErr)
        }
      }

      // 5. Salvar perfil
      const saveRes = await fetch('/api/atleta/salvar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          dataNascimento: dataNasc,
          nome,
          athleteId,
          avatarUrl,
          recoveryEmail: recoveryEmail.trim().toLowerCase() || null,
          ...(escolaId ? { escolaId } : {}),
        }),
      })

      if (!saveRes.ok) {
        const saveJson = await saveRes.json().catch(() => ({})) as { error?: string }
        throw new Error(saveJson.error ?? 'Erro ao salvar perfil. Tente novamente.')
      }

      // Log de aceite dos termos — falha silenciosa, não bloqueia o cadastro
      try {
        await fetch('/api/aceite-termos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: athleteId, tipo: 'atleta' }),
        })
      } catch (e) { console.warn('[aceite-termos]', e) }

      const params = new URLSearchParams({
        nome, posicao, cidade, dataNasc, uid: userId, athleteId,
        ...(avatarUrl ? { avatarUrl } : {}),
      })
      router.push(`/atleta/bem-vindo?${params.toString()}`)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.'
      console.error('[cadastro-atleta]', err)
      setError(msg)
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'system-ui, sans-serif',
    transition: 'border-color .2s, box-shadow .2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }

  return (
    <main style={{
      background: '#06100a', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px',
      paddingTop: 'max(24px, env(safe-area-inset-top))',
      paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '380px', margin: 'auto 0' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <Link href="/cadastro" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
              ← Voltar
            </Link>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>
                Entrar →
              </Link>
            </p>
          </div>

          {escolaId && escolaNome && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>⚽</span>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Convite aceito</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Escolinha de {escolaNome}</p>
              </div>
            </div>
          )}

          {refCode && !escolaId && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>🤝</span>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Indicação recebida</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Código: {refCode}</p>
              </div>
            </div>
          )}

          {/* Steps */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                flex: 1, height: '3px', borderRadius: '2px',
                background: s <= step ? '#22c55e' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#22c55e', textTransform: 'uppercase' }}>
            {step === 1 ? 'Acesso · 1 de 2' : 'Identidade · 2 de 2'}
          </p>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            {step === 1 ? 'Crie seu acesso' : 'Monte seu perfil'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {step === 1
              ? 'Crie uma senha — seu ID é gerado automaticamente.'
              : 'Essas informações constroem sua identidade no ranking.'}
          </p>
        </div>

        {/* STEP 1 — Acesso */}
        {step === 1 && (
          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div>
              <label style={labelStyle}>Senha</label>
              <input
                type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" style={inputStyle}
              />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                O login é feito pelo ID gerado automaticamente + esta senha.
              </p>
            </div>

            <div>
              <label style={labelStyle}>
                Email de recuperação <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email" required value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)}
                placeholder="email do responsável / pai ou mãe"
                style={inputStyle}
              />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
                Se esquecer o ID, use este email para recuperar. Um pai pode colocar o mesmo email em vários filhos.
              </p>
            </div>

            <div
              onClick={() => setConsent(c => !c)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                background: consent ? '#22c55e' : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${consent ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {consent && <span style={{ fontSize: '12px', color: 'black', fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                Confirmo que sou o responsável legal pelo atleta cadastrado e autorizo o uso de seus dados e imagens conforme os{' '}
                <Link href="/termos" target="_blank" onClick={e => e.stopPropagation()} style={{ color: '#22c55e', textDecoration: 'none' }}>Termos de Uso</Link>.
              </span>
            </div>

            {error && <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>{error}</p>}

            <button type="submit" style={{
              padding: '16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '16px', marginTop: '4px',
              minHeight: '56px', transition: 'transform .08s, opacity .1s',
              boxShadow: '0 0 28px rgba(34,197,94,0.2)',
            }}>
              Continuar →
            </button>
          </form>
        )}

        {/* STEP 2 — Identidade + Foto */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* ── FOTO ── */}
            <div>
              <label style={labelStyle}>
                Foto do atleta <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
              </label>

              {/* Guia visual */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '8px', marginBottom: '12px',
              }}>
                {/* Exemplo BOM */}
                <div style={{
                  borderRadius: '12px', overflow: 'hidden',
                  border: '1.5px solid rgba(34,197,94,0.4)',
                  background: 'rgba(34,197,94,0.05)',
                  padding: '10px',
                }}>
                  <div style={{
                    width: '100%', aspectRatio: '3/4',
                    background: 'linear-gradient(160deg,#1a3a2a,#0b1f14)',
                    borderRadius: '8px', marginBottom: '8px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}>
                    {/* Silhueta boa */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(34,197,94,0.4)' }} />
                    <div style={{ width: '50px', height: '40px', borderRadius: '8px 8px 0 0', background: 'rgba(34,197,94,0.3)', marginTop: '2px' }} />
                  </div>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#22c55e', textAlign: 'center' }}>✓ ASSIM</p>
                  <p style={{ margin: '2px 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.4 }}>
                    Rosto visível<br />Fundo simples<br />Foto sozinho
                  </p>
                </div>

                {/* Exemplo RUIM */}
                <div style={{
                  borderRadius: '12px', overflow: 'hidden',
                  border: '1.5px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.04)',
                  padding: '10px',
                }}>
                  <div style={{
                    width: '100%', aspectRatio: '3/4',
                    background: 'linear-gradient(160deg,#2a1a1a,#1f0b0b)',
                    borderRadius: '8px', marginBottom: '8px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}>
                    {/* Silhuetas múltiplas / ruim */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(239,68,68,0.3)' }} />
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239,68,68,0.5)' }} />
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(239,68,68,0.3)' }} />
                    </div>
                    <div style={{ fontSize: '18px', marginTop: '4px' }}>🕶️</div>
                  </div>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#f87171', textAlign: 'center' }}>✗ EVITE</p>
                  <p style={{ margin: '2px 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.4 }}>
                    Óculos escuros<br />Grupo de pessoas<br />Foto escura
                  </p>
                </div>
              </div>

              {/* Área de upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', borderRadius: '14px', cursor: 'pointer',
                  border: `2px dashed ${photoPreview ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  background: photoPreview ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: photoPreview ? '8px' : '20px 16px',
                  gap: '8px', transition: 'all 0.2s', boxSizing: 'border-box',
                }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="preview"
                    style={{ width: '90px', height: '110px', objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: '28px' }}>📸</div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                      Toque para adicionar foto
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                      Adicione agora ou depois no seu perfil
                    </p>
                  </>
                )}
              </div>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Trocar foto
                </button>
              )}
            </div>

            <div>
              <label style={labelStyle}>Nome completo</label>
              <input
                type="text" required value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Seu nome de atleta" style={inputStyle}
              />
            </div>

            {/* ── SEXO ── */}
            <div>
              <label style={labelStyle}>Sexo <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {(['Masculino', 'Feminino'] as const).map(opt => {
                  const active = sexo === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSexo(opt)}
                      style={{
                        padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                        border: `1.5px solid ${active ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                        background: active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#22c55e' : 'rgba(255,255,255,0.5)',
                        fontWeight: 700, fontSize: '14px',
                        transition: 'all 0.2s', fontFamily: 'system-ui, sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      }}
                    >
                      {opt === 'Masculino' ? '♂' : '♀'} {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Posição</label>
              <select
                required value={posicao} onChange={e => setPosicao(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="" disabled style={{ background: '#06100a' }}>Selecione sua posição</option>
                {posicoes.map(p => (
                  <option key={p} value={p} style={{ background: '#06100a' }}>{p}</option>
                ))}
              </select>
            </div>

            {/* ── PAÍS ── */}
            <div>
              <label style={labelStyle}>País</label>
              <select
                value={pais} onChange={e => { setPais(e.target.value); setEstado(''); setCidade('') }}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                {[
                  'Brasil','Argentina','Bolívia','Chile','Colômbia','Equador','Paraguai','Peru','Uruguai','Venezuela',
                  '—',
                  'Portugal','Espanha','França','Itália','Alemanha','Inglaterra',
                  '—',
                  'Estados Unidos','México',
                  '—',
                  'Outro',
                ].map(p => (
                  <option key={p} value={p} disabled={p === '—'} style={{ background: '#06100a' }}>{p === '—' ? '──────────' : p}</option>
                ))}
              </select>
            </div>

            {/* ── ESTADO (só Brasil) ── */}
            {pais === 'Brasil' && (
              <div>
                <label style={labelStyle}>Estado</label>
                <select
                  required value={estado} onChange={e => { setEstado(e.target.value); setCidade('') }}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled style={{ background: '#06100a' }}>Selecione o estado</option>
                  {ESTADOS_BR.map(uf => (
                    <option key={uf} value={uf} style={{ background: '#06100a' }}>{uf}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ── CIDADE ── */}
            <div>
              <label style={labelStyle}>Cidade</label>
              {pais === 'Brasil' ? (
                <select
                  required value={cidade} onChange={e => setCidade(e.target.value)}
                  disabled={!estado}
                  style={{ ...inputStyle, appearance: 'none', cursor: estado ? 'pointer' : 'default', opacity: estado ? 1 : 0.4 }}
                >
                  <option value="" disabled style={{ background: '#06100a' }}>
                    {estado ? 'Selecione a cidade' : 'Selecione o estado primeiro'}
                  </option>
                  {(CIDADES_BR[estado] ?? []).map(c => (
                    <option key={c} value={c} style={{ background: '#06100a' }}>{c}</option>
                  ))}
                </select>
              ) : (CIDADES_INTL[pais] ?? []).length > 0 ? (
                <select
                  required value={cidade} onChange={e => setCidade(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled style={{ background: '#06100a' }}>Selecione a cidade</option>
                  {(CIDADES_INTL[pais] ?? []).map(c => (
                    <option key={c} value={c} style={{ background: '#06100a' }}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text" required value={cidade} onChange={e => setCidade(e.target.value)}
                  placeholder="Sua cidade" style={inputStyle}
                />
              )}
            </div>

            <div>
              <label style={labelStyle}>Data de nascimento</label>
              <input
                type="date" required value={dataNasc} onChange={e => setDataNasc(e.target.value)}
                style={inputStyle}
              />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                Usada para colocar você na categoria certa (Sub-13, Sub-15…)
              </p>
            </div>

            {error && (
              <div style={{ margin: 0, padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#f87171', lineHeight: 1.5 }}>{error}</p>
                {error.includes('futebol de base') && (
                  <Link href="/treinador/cadastro" style={{
                    display: 'inline-block', marginTop: '10px', padding: '8px 14px',
                    borderRadius: '8px', background: 'rgba(34,197,94,0.15)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    color: '#22c55e', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                  }}>
                    Criar perfil de treinador →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                padding: '16px', borderRadius: '14px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '16px',
                opacity: loading ? 0.6 : 1, marginTop: '4px',
                minHeight: '56px', transition: 'transform .08s, opacity .15s',
                boxShadow: '0 0 28px rgba(34,197,94,0.2)',
              }}
            >
              {loading ? 'Criando perfil…' : '🔥 Entrar no jogo'}
            </button>

            <button type="button" onClick={() => { setStep(1); setError(null) }} style={{
              padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer',
            }}>
              ← Voltar
            </button>
          </form>
        )}

      </div>
    </main>
  )
}
