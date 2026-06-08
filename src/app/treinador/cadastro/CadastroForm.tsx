'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function formatarDocumento(value: string, isEscola: boolean) {
  const nums = value.replace(/\D/g, '')
  if (isEscola && nums.length > 11) {
    return nums.slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }
  return nums.slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function validarCPF(cpf: string) {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11 || /^(\d)\1+$/.test(nums)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(nums[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(nums[10])
}

function validarCNPJ(cnpj: string) {
  const nums = cnpj.replace(/\D/g, '')
  if (nums.length !== 14 || /^(\d)\1+$/.test(nums)) return false
  const calc = (n: string, peso: number[]) => {
    const soma = peso.reduce((acc, p, i) => acc + parseInt(n[i]) * p, 0)
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  const d1 = calc(nums, [5,4,3,2,9,8,7,6,5,4,3,2])
  if (d1 !== parseInt(nums[12])) return false
  const d2 = calc(nums, [6,5,4,3,2,9,8,7,6,5,4,3,2])
  return d2 === parseInt(nums[13])
}

function validarDocumento(doc: string) {
  const nums = doc.replace(/\D/g, '')
  if (nums.length === 14) return validarCNPJ(doc)
  return validarCPF(doc)
}

function calcularIdade(dataNasc: string) {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

const CATEGORIAS = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto']

export default function CadastroForm({ isEscola }: { isEscola: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1 — Acesso
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)

  // Step 2 — Perfil
  const [nome, setNome] = useState('')
  const [nomeEscola, setNomeEscola] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNasc, setDataNasc] = useState('')
  const [paisNascimento, setPaisNascimento] = useState('')
  const [cidade, setCidade] = useState('')
  const [clubeAtual, setClubeAtual] = useState('')
  const [categoria, setCategoria] = useState('')
  const [certificacao, setCertificacao] = useState('')
  const [experienciaAnos, setExperienciaAnos] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleCpf(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatarDocumento(e.target.value, isEscola))
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Informe seu email.'); return }
    if (!password || password.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (!consent) { setError('Confirme os termos de uso para continuar.'); return }
    setError(null)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!dataNasc) { setError('Informe sua data de nascimento.'); return }
    if (calcularIdade(dataNasc) < 18) { setError('É necessário ter 18 anos ou mais.'); return }
    if (!validarDocumento(cpf)) {
      setError(`${isEscola ? 'CPF ou CNPJ' : 'CPF'} inválido. Verifique e tente novamente.`)
      return
    }

    setLoading(true)

    try {
      const verificar = await fetch('/api/cadastro/verificar-cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      })
      const verificarData = await verificar.json() as { disponivel?: boolean; error?: string }
      if (!verificar.ok || verificarData.disponivel === false) {
        throw new Error('Este CPF já está cadastrado.')
      }

      const supabase = createClient()
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tipo: isEscola ? 'escola' : 'treinador',
            ...(isEscola && nomeEscola ? { nome_escola: nomeEscola } : {}),
            ...(!isEscola && {
              pais_nascimento:    paisNascimento.trim() || null,
              cidade:             cidade.trim()         || null,
              clube_atual:        clubeAtual.trim()     || null,
              categoria_trabalho: categoria             || null,
              certificacao:       certificacao.trim()   || null,
              experiencia_anos:   experienciaAnos ? Number(experienciaAnos) : null,
            }),
          },
        },
      })

      if (signUpErr || !data.user) {
        let msg = 'Não foi possível criar a conta. Tente novamente.'
        if (signUpErr?.message) {
          const m = signUpErr.message.toLowerCase()
          if (m.includes('already registered')) msg = 'Este e-mail já está cadastrado. Tente fazer login.'
          else if (m.includes('password')) msg = 'A senha deve ter pelo menos 6 caracteres.'
          else if (m.includes('rate limit')) msg = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
          else if (m.includes('invalid email')) msg = 'E-mail inválido. Verifique e tente novamente.'
        }
        throw new Error(msg)
      }

      if (!data.user.identities || data.user.identities.length === 0) {
        throw new Error('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.')
      }

      const salvar = await fetch('/api/cadastro/salvar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, cpf, dataNascimento: dataNasc, nome, email, tipo: isEscola ? 'escola' : 'treinador' }),
      })

      if (!salvar.ok) {
        const salvarData = await salvar.json().catch(() => ({})) as { error?: string }
        throw new Error(salvar.status === 409 ? 'Este CPF já está cadastrado.' : (salvarData.error ?? 'Erro ao salvar perfil.'))
      }

      try {
        await fetch('/api/aceite-termos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: data.user.id, tipo: 'treinador' }),
        })
      } catch (e) { console.warn('[aceite-termos]', e) }

      router.push('/treinador/bem-vindo')

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.'
      console.error('[cadastro-treinador]', err)
      setError(msg)
      setLoading(false)
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'system-ui, sans-serif',
    transition: 'border-color .2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: 'rgba(255,255,255,0.5)', marginBottom: '8px',
    letterSpacing: '0.04em', textTransform: 'uppercase',
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
            <button
              onClick={() => step === 2 ? (setStep(1), setError(null)) : router.push('/cadastro')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'rgba(255,255,255,0.35)', padding: 0, fontFamily: 'system-ui, sans-serif' }}
            >
              ← Voltar
            </button>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>Entrar →</Link>
            </p>
          </div>

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
            {step === 1 ? 'Acesso · 1 de 2' : 'Perfil · 2 de 2'}
          </p>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            {step === 1 ? 'Crie seu acesso' : isEscola ? 'Dados da escola' : 'Perfil profissional'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {step === 1
              ? 'Crie email e senha para entrar na plataforma.'
              : isEscola ? 'Informações da escola e do responsável.' : 'Monte seu currículo e seja encontrado por escolas.'}
          </p>
        </div>

        {/* ── STEP 1: Acesso ── */}
        {step === 1 && (
          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Senha</label>
              <input
                type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" style={fieldStyle}
              />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                Use este email + senha para entrar na plataforma.
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
                Confirmo que sou maior de idade e concordo com os{' '}
                <Link href="/termos" target="_blank" onClick={e => e.stopPropagation()} style={{ color: '#22c55e', textDecoration: 'none' }}>Termos de Uso</Link>{' '}da plataforma.
              </span>
            </div>

            {error && (
              <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
                {error}
              </p>
            )}

            <button type="submit" style={{
              padding: '16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '16px', marginTop: '4px',
              minHeight: '56px', boxShadow: '0 0 28px rgba(34,197,94,0.2)',
            }}>
              Continuar →
            </button>
          </form>
        )}

        {/* ── STEP 2: Perfil ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {isEscola && (
              <div>
                <label style={labelStyle}>Nome da escola</label>
                <input
                  type="text" required value={nomeEscola} onChange={e => setNomeEscola(e.target.value)}
                  placeholder="Ex: Escolinha do Craque FC" style={fieldStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Nome completo</label>
              <input
                type="text" required value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Seu nome" style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>{isEscola ? 'CPF ou CNPJ' : 'CPF'}</label>
              <input
                type="text" required value={cpf} onChange={handleCpf}
                placeholder={isEscola ? 'CPF ou CNPJ' : '000.000.000-00'} style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Data de nascimento</label>
              <input
                type="date" required value={dataNasc} onChange={e => setDataNasc(e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                style={fieldStyle}
              />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Necessário ter 18 anos ou mais.</p>
            </div>

            {/* Campos extras — só treinador */}
            {!isEscola && (
              <>
                <div style={{ padding: '12px 0 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    📋 Perfil profissional
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>País de nascimento</label>
                  <input type="text" value={paisNascimento} onChange={e => setPaisNascimento(e.target.value)} placeholder="Ex: Brasil" style={fieldStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Cidade e Estado</label>
                  <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Ex: São Paulo – SP" style={fieldStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Clube ou organização atual</label>
                  <input type="text" value={clubeAtual} onChange={e => setClubeAtual(e.target.value)} placeholder="Ex: Escolinha Craque FC" style={fieldStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Categoria que trabalha</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}>
                    <option value="" style={{ background: '#1a1a1a' }}>Selecione...</option>
                    {CATEGORIAS.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Certificação / licença</label>
                  <input type="text" value={certificacao} onChange={e => setCertificacao(e.target.value)} placeholder='Ex: "CBF A", "UEFA B"' style={fieldStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Tempo de experiência (anos)</label>
                  <input type="number" value={experienciaAnos} onChange={e => setExperienciaAnos(e.target.value)} min="0" max="60" placeholder="Ex: 5" style={fieldStyle} />
                </div>
              </>
            )}

            {error && (
              <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                padding: '16px', borderRadius: '14px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '16px',
                opacity: loading ? 0.6 : 1, marginTop: '4px',
                minHeight: '56px', boxShadow: '0 0 28px rgba(34,197,94,0.2)',
              }}
            >
              {loading ? 'Criando conta…' : isEscola ? '🏟️ Cadastrar escola' : '👨‍🏫 Criar perfil'}
            </button>

            <button type="button" onClick={() => { setStep(1); setError(null) }} style={{
              padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
            }}>
              ← Voltar
            </button>
          </form>
        )}

      </div>
    </main>
  )
}
