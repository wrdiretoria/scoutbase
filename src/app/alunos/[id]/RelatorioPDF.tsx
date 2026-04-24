import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

type Avaliacao = {
  nota: number
  categoria: string | null
  data: string | null
}

export type RelatorioPDFProps = {
  nomeAluno: string
  turma: string | null
  posicao: string | null
  scoutScore: number | null
  frequencia: number | null
  frequenciaMes: number | null
  presentes: number
  totalPresencas: number
  avaliacoes: Avaliacao[]
  nomeEscolinha: string
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: '#1a1a1a',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
  },
  escolinhaNome: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  headerSub: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 3,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 80,
    color: '#6b7280',
  },
  infoValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  metricCardLast: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
  },
  metricSub: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 8,
    color: '#6b7280',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowDate: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#111827',
  },
  tableRowCategories: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  tableRowScore: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    alignSelf: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

function scoreColor(score: number | null): string {
  if (score === null) return '#9ca3af'
  if (score >= 75) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

function freqColor(freq: number | null): string {
  if (freq === null) return '#9ca3af'
  return freq >= 75 ? '#16a34a' : '#dc2626'
}

export function RelatorioPDF({
  nomeAluno,
  turma,
  posicao,
  scoutScore,
  frequencia,
  frequenciaMes,
  presentes,
  totalPresencas,
  avaliacoes,
  nomeEscolinha,
}: RelatorioPDFProps) {
  const grouped = Object.entries(
    (avaliacoes ?? []).reduce((acc, av) => {
      const key = av.data ?? 'sem-data'
      if (!acc[key]) acc[key] = []
      acc[key].push(av)
      return acc
    }, {} as Record<string, Avaliacao[]>)
  ).sort(([a], [b]) => b.localeCompare(a))

  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const mesAtual = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.escolinhaNome}>{nomeEscolinha}</Text>
          <Text style={styles.headerSub}>RELATORIO DO ATLETA</Text>
        </View>

        {/* Dados do atleta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ATLETA</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome</Text>
            <Text style={styles.infoValue}>{nomeAluno}</Text>
          </View>
          {turma && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Turma</Text>
              <Text style={styles.infoValue}>{turma}</Text>
            </View>
          )}
          {posicao && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Posicao</Text>
              <Text style={styles.infoValue}>{posicao}</Text>
            </View>
          )}
        </View>

        {/* Métricas */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Scout Score</Text>
            <Text style={[styles.metricValue, { color: scoreColor(scoutScore) }]}>
              {scoutScore ?? '—'}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Frequencia Total</Text>
            <Text style={[styles.metricValue, { color: freqColor(frequencia) }]}>
              {frequencia !== null ? `${frequencia}%` : '—'}
            </Text>
            {totalPresencas > 0 && (
              <Text style={styles.metricSub}>
                {presentes}/{totalPresencas} aulas
              </Text>
            )}
          </View>

          <View style={styles.metricCardLast}>
            <Text style={styles.metricLabel}>Frequencia — {mesAtual}</Text>
            <Text style={[styles.metricValue, { color: freqColor(frequenciaMes) }]}>
              {frequenciaMes !== null ? `${frequenciaMes}%` : '—'}
            </Text>
          </View>
        </View>

        {/* Histórico de avaliações */}
        {grouped.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HISTORICO DE AVALIACOES</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Data</Text>
              <Text style={styles.tableHeaderText}>Media</Text>
            </View>
            {grouped.slice(0, 10).map(([data, avs]) => {
              const media = Math.round(
                avs.reduce((s, a) => s + a.nota, 0) / avs.length
              )
              const dataStr =
                data !== 'sem-data'
                  ? new Date(data).toLocaleDateString('pt-BR')
                  : 'Sem data'
              const categorias = avs
                .map((a) => a.categoria)
                .filter(Boolean)
                .join(' · ')

              return (
                <View key={data} style={styles.tableRow}>
                  <View>
                    <Text style={styles.tableRowDate}>{dataStr}</Text>
                    {categorias ? (
                      <Text style={styles.tableRowCategories}>{categorias}</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.tableRowScore, { color: scoreColor(media) }]}>
                    {media}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {grouped.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HISTORICO DE AVALIACOES</Text>
            <Text style={{ color: '#9ca3af', fontSize: 10 }}>
              Nenhuma avaliacao registrada ainda.
            </Text>
          </View>
        )}

        {/* Rodapé */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>ScoutBase · Gerado em {dataGeracao}</Text>
          <Text style={styles.footerText}>{nomeAluno}</Text>
        </View>
      </Page>
    </Document>
  )
}
