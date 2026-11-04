/**
 * POST /api/indicacao/registrar — DESATIVADA.
 *
 * Antes o próprio navegador registrava a indicação com {refCode, newUserId}, sem
 * conferir quem estava logado nem se a pessoa já tinha sido contada — dava para
 * inflar o contador e ganhar card grátis. Agora a indicação é confirmada só no
 * servidor, em /api/atleta/salvar-perfil (lib/indicacao.ts), com o cadastro completo.
 */
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { ok: false, reason: 'deprecated', error: 'A indicação agora é registrada automaticamente ao concluir o cadastro.' },
    { status: 410 },
  )
}

