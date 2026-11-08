export function normalizeCnpj(value: string) {
  return value.replace(/[.\/\s-]/g, '').toUpperCase()
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeCnpj(value)
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false

  const digit = (base: string) => {
    let weight = base.length - 7
    let sum = 0
    for (const character of base) {
      sum += (character.charCodeAt(0) - 48) * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  return digit(cnpj.slice(0, 12)) === Number(cnpj[12])
    && digit(cnpj.slice(0, 13)) === Number(cnpj[13])
}
