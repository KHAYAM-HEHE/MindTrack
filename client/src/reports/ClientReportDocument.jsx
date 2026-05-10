import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, color: "#0b1c30" },
  title: { fontSize: 18, marginBottom: 6, fontWeight: 700, color: "#00685f" },
  subtitle: { fontSize: 10, marginBottom: 14, color: "#3d4947" },
  section: { marginBottom: 10, padding: 10, border: "1 solid #d3e4fe", borderRadius: 6 },
  sectionTitle: { fontSize: 12, marginBottom: 6, fontWeight: 700 },
  row: { marginBottom: 3 },
  key: { fontWeight: 700 },
});

export default function ClientReportDocument({ range, report }) {
  const totals = report?.totals || {};
  const metrics = report?.metrics || {};
  const breakdown = report?.breakdown || {};
  const insights = Array.isArray(report?.insights)
    ? report.insights
    : report?.insights
      ? [String(report.insights)]
      : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>MindTrack Client Report</Text>
        <Text style={styles.subtitle}>Range: {range} | Generated: {new Date().toISOString()}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totals</Text>
          <Text style={styles.row}><Text style={styles.key}>Mood Entries:</Text> {totals.moodEntries ?? 0}</Text>
          <Text style={styles.row}><Text style={styles.key}>Medication Logs:</Text> {totals.medicationLogs ?? 0}</Text>
          {totals.dmsDaysCovered !== undefined ? (
            <Text style={styles.row}><Text style={styles.key}>DMS Days Covered:</Text> {totals.dmsDaysCovered}</Text>
          ) : null}
          {totals.overlapDays !== undefined ? (
            <Text style={styles.row}><Text style={styles.key}>Mood/Medication Overlap Days:</Text> {totals.overlapDays}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metrics</Text>
          <Text style={styles.row}><Text style={styles.key}>Mood Average:</Text> {metrics.moodAverage ?? 0}</Text>
          {metrics.anxietyAverage !== undefined ? (
            <Text style={styles.row}><Text style={styles.key}>Anxiety Average:</Text> {metrics.anxietyAverage}</Text>
          ) : null}
          {metrics.stressAverage !== undefined ? (
            <Text style={styles.row}><Text style={styles.key}>Stress Average:</Text> {metrics.stressAverage}</Text>
          ) : null}
          {metrics.medicationImpactScore !== undefined ? (
            <Text style={styles.row}><Text style={styles.key}>Medication Impact Score:</Text> {metrics.medicationImpactScore}</Text>
          ) : null}
          {metrics.adherenceSensitiveDelta !== undefined ? (
            <Text style={styles.row}><Text style={styles.key}>Adherence-sensitive delta:</Text> {metrics.adherenceSensitiveDelta}</Text>
          ) : null}
        </View>

        {metrics.detailedQuestionAverages ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed DMS Question Averages</Text>
            <Text style={styles.row}><Text style={styles.key}>Focus score:</Text> {metrics.detailedQuestionAverages.focusScore ?? 0}</Text>
            <Text style={styles.row}><Text style={styles.key}>Social connection score:</Text> {metrics.detailedQuestionAverages.socialConnectionScore ?? 0}</Text>
            <Text style={styles.row}><Text style={styles.key}>Irritability score:</Text> {metrics.detailedQuestionAverages.irritabilityScore ?? 0}</Text>
          </View>
        ) : null}

        {breakdown.sleepQualityCounts ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sleep Quality Distribution</Text>
            {Object.entries(breakdown.sleepQualityCounts).map(([k, v]) => (
              <Text key={k} style={styles.row}>- {k}: {v}</Text>
            ))}
          </View>
        ) : null}

        {Array.isArray(breakdown.dayComparisons) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medication vs DMS by Day</Text>
            {breakdown.dayComparisons.slice(0, 14).map((item) => (
              <Text key={item.day} style={styles.row}>
                - {item.day}: adherence {item.adherenceRate}% | DMS mood {item.moodAverage}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          {insights.length ? insights.map((item, idx) => <Text key={idx} style={styles.row}>- {item}</Text>) : <Text style={styles.row}>No insights available.</Text>}
        </View>
      </Page>
    </Document>
  );
}

