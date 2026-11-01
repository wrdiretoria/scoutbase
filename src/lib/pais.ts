/**
 * E-mail sintético usado como identidade dos responsáveis no Supabase Auth.
 * O responsável entra com o número do atleta (SID) + senha; o e-mail nunca é
 * mostrado. O formato antigo tinha um espaço ("@pais.Meu Craque") e não é um
 * e-mail válido; fica só como alternativa de login para contas antigas.
 */
export function sidParaEmailPais(sid: string): string {
  return `${sid.trim().toLowerCase()}@pais.meucraque.com`
}

export function sidParaEmailPaisLegado(sid: string): string {
  return `${sid.trim().toLowerCase()}@pais.Meu Craque`
}

/** Aceita o link inteiro (…/p/<token>) ou só o token. */
export function extrairTokenDoLink(valor: string): string {
  const texto = valor.trim()
  const doLink = texto.match(/\/p\/([A-Za-z0-9_-]{4,128})/)
  if (doLink) return doLink[1]
  return texto
}
