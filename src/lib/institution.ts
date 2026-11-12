import { isValidCnpj, normalizeCnpj } from './cnpj'

export type Institution = {
  owner_id: string
  kind: 'clube' | 'escolinha'
  nome: string
  cnpj: string | null
  cidade: string
  responsavel_nome: string
  responsavel_cargo: string
  verification_status: 'pending' | 'verified'
}

export function readInstitution(body: Record<string, unknown>) {
  const text = (key: string) => typeof body[key] === 'string' ? body[key].trim() : ''
  const data = {
    kind: text('kind'),
    nome: text('nome'),
    cnpj: text('cnpj') ? normalizeCnpj(text('cnpj')) : null,
    cidade: text('cidade'),
    responsavel_nome: text('responsavel_nome'),
    responsavel_cargo: text('responsavel_cargo'),
  }
  if (data.kind !== 'clube' && data.kind !== 'escolinha') throw new Error('Escolha Clube ou Escolinha.')
  if (data.kind === 'clube' && data.cnpj === null) throw new Error('Informe o CNPJ do clube.')
  if (data.cnpj !== null && !isValidCnpj(data.cnpj)) throw new Error('Confira o CNPJ informado.')
  for (const [key, label] of [
    ['nome', 'Nome da instituição'], ['cidade', 'Cidade'],
    ['responsavel_nome', 'Nome do responsável'], ['responsavel_cargo', 'Cargo do responsável'],
  ] as const) {
    if (data[key].length < 2 || data[key].length > 160) throw new Error(label + ' deve ter entre 2 e 160 caracteres.')
  }
  return data
}
