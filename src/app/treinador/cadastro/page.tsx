'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function formatarCPF(value: string) {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  return nums
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

function calcularIdade(dataNasc: string) {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export default function TreinadorCadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNasc, setDataNasc] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleCpf(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatarCPF(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!dataNasc) { setError('Informe sua data de nascimento.'); return }
    if (calcularIdade(dataNasc) < 18) {
      setError('É necessário ter 18 anos ou mais para criar uma conta de treinador.')
      return
    }
    if (!validarCPF(cpf)) {
      setError('CPF inválido. Verifique e tente novamente.')
      return
    }

    setLoading(true)

    const verificar = await fetch('/api/cadastro/verificar-cpf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
    })
    const verificarData = await verificar.json() as { disponivel?: boolean; error?: string }

    if (!verificar.ok || verificarData.disponivel === false) {
      setError('Este CPF já está cadastrado.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome, tipo: 'treinador' } },
    })

    if (signUpErr || !data.user) {
      setError('Não foi possível criar a conta. Tente novamente.')
      setLoading(false)
      return
    }

    const salvar = await fetch('/api/cadastro/salvar-perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: data.user.id, cpf, dataNascimento: dataNasc }),
    })

    if (!salvar.ok) {
      const salvarData = await salvar.json() as { error?: string }
      setError(salvar.status === 409 ? 'Este CPF já está cadastrado.' : (salvarData.error ?? 'Erro ao salvar perfil.'))
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '360px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '32px 28px',
      }}>
        <Link href="/cadastro" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'block', marginBottom: '20px' }}>
          ← Voltar
        </Link>
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#22c55e', textTransform: 'uppercase' }}>Treinador</p>
        <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: 'white' }}>Criar conta</h1>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Gerencie sua escolinha no MeuCraque.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { id: 'nome', label: 'Nome completo', type: 'text', value: nome, setter: setNome, placeholder: 'Seu nome' },
            { id: 'cpf',  label: 'CPF', type: 'text', value: cpf, setter: (v: string) => setCpf(v), placeholder: '000.000.000-00', inputMode: 'numeric' as const },
            { id: 'email', label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'seu@email.com' },
            { id: 'password', label: 'Senha', type: 'password', value: password, setter: setPassword, placeholder: 'Mínimo 6 caracteres' },
          ].map(f => (
            <div key={f.id}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{f.label}</label>
              <input
                id={f.id} type={f.type} required value={f.value}
                onChange={f.id === 'cpf' ? handleCpf : (e) => (f.setter as (v: string) => void)(e.target.value)}
                placeholder={f.placeholder}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '14px', outline: 'none',
                }}
              />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Data de nascimento</label>
            <input
              type="date" required value={dataNasc}
              onChange={(e) => setDataNasc(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '14px', outline: 'none',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Necessário ter 18 anos ou mais.</p>
          </div>

          {error && <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>{error}</p>}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '12px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '15px',
              opacity: loading ? 0.6 : 1, marginTop: '4px',
            }}
          >
            {loading ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <p style={{ margin: '20px 0 0', fontSize: '13px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </main>
  )
}
