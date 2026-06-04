import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Rota TEMPORÁRIA de seed — remove após uso
export async function GET() {
  const admin = createAdminClient()
  const atletaId = '0cc6a50f-8680-4e8b-87a6-19ff208613df'

  // Remove avaliações de teste anteriores
  await admin.from('avaliacoes')
    .delete()
    .eq('aluno_id', atletaId)
    .eq('observacao', 'Teste Claude Code')

  const { error } = await admin.from('avaliacoes').insert({
    professor_id:   atletaId,
    aluno_id:       atletaId,
    scout_score:    90,
    velocidade:     9,
    forca:          9,
    finalizacao:    9,
    visao_jogo:     8,
    posicionamento: 8,
    tecnica:        9,
    tecnico:        88,
    fisico:         85,
    tatico:         80,
    comportamento:  90,
    observacao:     'Teste Claude Code',
    variante:       'profissional',
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'Avaliação inserida — OVR agora 85, Card Ouro' })
}
