const BASE = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3'

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY ?? '',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const body = await res.json()
  if (!res.ok) {
    throw new Error(`Asaas ${res.status}: ${JSON.stringify(body)}`)
  }
  return body as T
}

export type AsaasCliente = {
  id: string
  name: string
  cpfCnpj?: string
  email?: string
}

export type AsaasCobranca = {
  id: string
  customer: string
  billingType: string
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH'
  value: number
  netValue: number
  dueDate: string
  paymentDate?: string
  invoiceUrl?: string
  externalReference?: string
}

export type CriarCobrancaInput = {
  customer: string
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'
  value: number
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
  splits?: { walletId: string; percentualValue?: number; fixedValue?: number }[]
}

export const asaas = {
  criarCliente: (data: { name: string; cpfCnpj?: string; email?: string }) =>
    req<AsaasCliente>('/customers', { method: 'POST', body: JSON.stringify(data) }),

  criarCobranca: (data: CriarCobrancaInput) =>
    req<AsaasCobranca>('/payments', { method: 'POST', body: JSON.stringify(data) }),

  buscarCobranca: (id: string) =>
    req<AsaasCobranca>(`/payments/${id}`),

  pixQrCode: (paymentId: string) =>
    req<{ encodedImage: string; payload: string; expirationDate: string }>(
      `/payments/${paymentId}/pixQrCode`
    ),
}

/** Calcula split: Meu Craque fica 3,99%, treinador recebe o restante */
export function calcularSplit(valor: number) {
  const taxaApp = Math.round(valor * 0.0399 * 100) / 100
  const treinador = Math.round((valor - taxaApp) * 100) / 100
  return { taxaApp, treinador }
}
