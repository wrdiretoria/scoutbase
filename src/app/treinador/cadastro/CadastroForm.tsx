'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function formatarDocumento(value: string, isEscola: boolean) {
  const nums = value.replace(/\D/g, '')
  if (isEscola && nums.length > 11) {
    // CNPJ: XX.XXX.XXX/XXXX-XX
    return nums.slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }
  // CPF: XXX.XXX.XXX-XX
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
  const [nome, setNome] = useState('')
  const [nomeEscola, setNomeEscola] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNasc, setDataNasc] = useState('')
  // Campos extras — só para treinador
  const [paisNascimento, setPaisNascimento] = useState('')
  const [cidade, setCidade] = useState('')
  const [clubeAtual, setClubeAtual] = useState('')
  const [categoria, setCategoria] = useState('')
  const [certificacao, setCertificacao] = useState('')
  const [experienciaAnos, setExperienciaAnos] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleCpf(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatarDocumento(e.target.value, isEscola))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!consent) { setError('Confirme os termos de uso para continuar.'); return }
    if (!dataNasc) { setError('Informe sua data de nascimento.'); return }
    if (calcularIdade(dataNasc) < 18) {
      setError('É necessário ter 18 anos ou mais.')
      return
    }
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
            // Campos extras do treinador (armazenados em user_metadata)
            ...(!isEscola && {
              pais_nascimento:  paisNascimento.trim()  || null,
              cidade:           cidade.trim()           || null,
              clube_atual:      clubeAtual.trim()       || null,
              categoria_trabalho: categoria             || null,
              certificacao:     certificacao.trim()     || null,
              experiencia_anos: experienciaAnos ? Number(experienciaAnos) : null,
            }),
          },
        },
      })

      if (signUpErr || !data.user) {
        console.error('[cadastro-treinador] signUp error:', signUpErr?.message, signUpErr?.status)
        let msg = 'Não foi possível criar a conta. Tente novamente.'
        if (signUpErr?.message) {
          const m = signUpErr.message.toLowerCase()
          if (m.includes('already registered') || m.includes('user already registered')) {
            msg = 'Este e-mail já está cadastrado. Tente fazer login.'
          } else if (m.includes('password should be at least') || m.includes('password')) {
            msg = 'A senha deve ter pelo menos 6 caracteres.'
          } else if (m.includes('rate limit') || m.includes('email rate limit exceeded')) {
            msg = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
          } else if (m.includes('invalid email') || m.includes('unable to validate')) {
            msg = 'E-mail inválido. Verifique e tente novamente.'
          } else if (m.includes('signup') && m.includes('disabled')) {
            msg = 'Cadastros estão temporariamente desabilitados.'
          }
        }
        throw new Error(msg)
      }

      // Supabase retorna user sem identities quando o e-mail já está cadastrado
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

      // Log de aceite dos termos — falha silenciosa, não bloqueia o cadastro
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

  const fieldStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px', boxSizing: 'border-box' as const,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '14px', outline: 'none',
  }
  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: 'rgba(255,255,255,0.6)', marginBottom: '6px',
  }

  return (
    <main style={{
      background: '#06100a', minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '360px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '32px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link href="/cadastro" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
            ← Voltar
          </Link>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>Entrar →</Link>
          </p>
        </div>

        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#22c55e', textTransform: 'uppercase' }}>
          {isEscola ? '🏟️ Escola de Futebol' : '👨‍🏫 Treinador'}
        </p>
        <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: 'white' }}>
          {isEscola ? 'Cadastrar minha escola' : 'Criar perfil de treinador'}
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          {isEscola ? 'Gerencie turmas, atletas e avaliações no Meu Craque.' : 'Monte seu currículo e seja encontrado por escolas.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {isEscola && (
            <div>
              <label style={labelStyle}>Nome da escola</label>
              <input
                type="text" required value={nomeEscola}
                onChange={e => setNomeEscola(e.target.value)}
                placeholder="Ex: Escolinha do Craque FC"
                style={fieldStyle}
              />
            </div>
          )}

          {[
            { id: 'nome', label: 'Nome completo', type: 'text', value: nome, setter: setNome, placeholder: 'Seu nome' },
            { id: 'cpf', label: isEscola ? 'CPF ou CNPJ' : 'CPF', type: 'text', value: cpf, setter: (v: string) => setCpf(v), placeholder: isEscola ? 'CPF ou CNPJ da escola' : '000.000.000-00' },
            { id: 'email', label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'seu@email.com' },
            { id: 'password', label: 'Senha', type: 'password', value: password, setter: setPassword, placeholder: 'Mínimo 6 caracteres' },
          ].map(f => (
            <div key={f.id}>
              <label style={labelStyle}>{f.label}</label>
              <input
                id={f.id} type={f.type} required value={f.value}
                onChange={f.id === 'cpf' ? handleCpf : (e) => (f.setter as (v: string) => void)(e.target.value)}
                placeholder={f.placeholder}
                style={fieldStyle}
              />
            </div>
          ))}

          <div>
            <label style={labelStyle}>Data de nascimento</label>
            <input
              type="date" required value={dataNasc}
              onChange={e => setDataNasc(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              style={fieldStyle}
            />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Necessário ter 18 anos ou mais.</p>
          </div>

          {/* ── Campos adicionais — só para treinador ── */}
          {!isEscola && (
            <>
              <div style={{ margin: '4px 0 0', padding: '12px 0 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  📋 Perfil profissional
                </p>
              </div>

              <div>
                <label style={labelStyle}>País de nascimento</label>
                <input
                  type="text" value={paisNascimento}
                  onChange={e => setPaisNascimento(e.target.value)}
                  placeholder="Ex: Brasil"
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Cidade e Estado</label>
                <input
                  type="text" value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  placeholder="Ex: São Paulo – SP"
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Clube ou organização atual</label>
                <input
                  type="text" value={clubeAtual}
                  onChange={e => setClubeAtual(e.target.value)}
                  placeholder="Ex: Escolinha Craque FC"
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Categoria que trabalha</label>
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="" style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.4)' }}>Selecione...</option>
                  {CATEGORIAS.map(c => (
                    <option key={c} value={c} style={{ background: '#1a1a1a', color: 'white' }}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Certificação / licença</label>
                <input
                  type="text" value={certificacao}
                  onChange={e => setCertificacao(e.target.value)}
                  placeholder='Ex: "CBF A", "UEFA B", "Sem certificação"'
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Tempo de experiência (anos)</label>
                <input
                  type="number" value={experienciaAnos}
                  onChange={e => setExperienciaAnos(e.target.value)}
                  min="0" max="60"
                  placeholder="Ex: 5"
                  style={fieldStyle}
                />
              </div>
            </>
          )}

          {/* Consentimento — LGPD */}
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

          {error && (
            <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '12px', borderRadius: '12px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: '#22c55e', color: 'black', fontWeight: 800,
              fontSize: '15px', opacity: loading ? 0.6 : 1, marginTop: '4px',
            }}
          >
            {loading ? 'Criando conta…' : isEscola ? 'Cadastrar escola' : 'Criar perfil'}
          </button>
        </form>
      </div>
    </main>
  )
}