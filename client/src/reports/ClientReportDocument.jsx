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
  const insights = Array.isArray(report?.insights)
    ? report.insights
    : report?.insights
      ? [String(report.insights)]
      : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>MindWell Client Report</Text>
        <Text style={styles.subtitle}>Range: {range} | Generated: {new Date().toISOString()}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totals</Text>
          <Text style={styles.row}><Text style={styles.key}>Tasks:</Text> {totals.tasks ?? 0}</Text>
          <Text style={styles.row}><Text style={styles.key}>Tasks Completed:</Text> {totals.tasksCompleted ?? 0}</Text>
          <Text style={styles.row}><Text style={styles.key}>Mood Entries:</Text> {totals.moodEntries ?? 0}</Text>
          <Text style={styles.row}><Text style={styles.key}>Medication Logs:</Text> {totals.medicationLogs ?? 0}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metrics</Text>
          <Text style={styles.row}><Text style={styles.key}>Completion Rate:</Text> {metrics.completionRate ?? 0}%</Text>
          <Text style={styles.row}><Text style={styles.key}>Mood Average:</Text> {metrics.moodAverage ?? 0}</Text>
          {metrics.medicationImpactScore !== undefined ? (
            <Text style={styles.row}><Text style={styles.key}>Medication Impact Score:</Text> {metrics.medicationImpactScore}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          {insights.length ? insights.map((item, idx) => <Text key={idx} style={styles.row}>- {item}</Text>) : <Text style={styles.row}>No insights available.</Text>}
        </View>
      </Page>
    </Document>
  );
}

