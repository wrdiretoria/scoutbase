/** Valida CPF pelo algoritmo módulo-11 (dígitos verificadores). */
export function isValidCpf(raw: string): boolean {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 11) return false
  // Rejeita sequências repetidas (00000000000, 11111111111, …)
  if (/^(\d)\1{10}$/.test(d)) return false

  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += parseInt(d[i]) * (len + 1 - i)
    const rem = (sum * 10) % 11
    return rem === 10 ? 0 : rem
  }

  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10])
}
