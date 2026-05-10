import { useMemo, useState } from "react";
import { FileText, Info, Sparkles } from "lucide-react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ClientReportDocument from "../../reports/ClientReportDocument";

const dmsRanges = ["daily", "weekly", "monthly", "yearly"];
const medicationRanges = ["medication-impact"];

const quickRanges = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
];

function insightText(report) {
  if (!report) return "Load a report to see an AI-style summary and export a PDF for your care team.";
  const list = Array.isArray(report.insights)
    ? report.insights
    : report.insights
      ? [String(report.insights)]
      : [];
  if (list.length) return list.join(" ");
  const m = report.metrics || {};
  const rate = m.completionRate ?? 0;
  const mood = m.moodAverage ?? 0;
  return `Completion rate is ${rate}% and mood average is ${mood.toFixed ? mood.toFixed(1) : mood} for this period. Review the chart and export for your records.`;
}

export default function ClientReportsPage() {
  const token = useAuthStore((s) => s.token);
  const { client, loadReport, loading, error } = useAppStore();
  const [reportType, setReportType] = useState("DMS");
  const [range, setRange] = useState("monthly");
  const report = client.reports?.[range] || null;
  const isMedicationReport = reportType === "MEDICATION";
  const dmsQuestionMetrics = report?.metrics?.detailedQuestionAverages || {};
  const dmsQuestionRows = [
    { key: "focusScore", label: "Focus and concentration" },
    { key: "socialConnectionScore", label: "Social connectedness" },
    { key: "irritabilityScore", label: "Irritability / emotional reactivity" },
  ];
  const dmsSeries = report?.breakdown?.dailySeries || [];
  const medSeries = report?.breakdown?.dayComparisons || [];
  const perMedication = report?.breakdown?.perMedicationImpact || [];

  const chartPoints = useMemo(() => {
    if (isMedicationReport) {
      return medSeries.map((item) => ({
        label: new Date(item.day).toLocaleDateString([], { month: "short", day: "numeric" }),
        value: Number(item.moodAverage || 0),
        secondary: Number(item.adherenceRate || 0),
      }));
    }
    return dmsSeries.map((item) => ({
      label: new Date(item.date).toLocaleDateString([], { month: "short", day: "numeric" }),
      value: Number(item.moodAverage || 0),
      secondary: Number(item.anxietyAverage || 0),
    }));
  }, [isMedicationReport, dmsSeries, medSeries]);

  return (
    <ClientShell title="Report Generation Center">
      <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 font-h1 text-h1 text-on-background">Clinical Reports</h1>
          <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
            DMS reports are based on your once-daily mood survey entries. Medication reports track impact on DMS outcomes separately.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-surface-container-high p-1 shadow-inner">
            <button
              type="button"
              className={`rounded-md px-5 py-2 text-sm font-label-md ${
                reportType === "DMS"
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => {
                setReportType("DMS");
                setRange("monthly");
              }}
            >
              DMS Reports
            </button>
            <button
              type="button"
              className={`rounded-md px-5 py-2 text-sm font-label-md ${
                reportType === "MEDICATION"
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => {
                setReportType("MEDICATION");
                setRange("medication-impact");
              }}
            >
              Medication Impact
            </button>
          </div>
          <div className="flex rounded-lg bg-surface-container-high p-1 shadow-inner">
            {reportType === "DMS" ? (
              quickRanges.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-md px-5 py-2 text-sm font-label-md ${
                    range === value
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  onClick={() => setRange(value)}
                >
                  {label}
                </button>
              ))
            ) : (
              <button
                type="button"
                className="rounded-md bg-surface-container-lowest px-5 py-2 text-sm font-label-md text-on-surface shadow-sm"
                onClick={() => setRange("medication-impact")}
              >
                Monthly Impact
              </button>
            )}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-on-primary shadow-md shadow-primary/25 transition-all hover:bg-primary-container"
            onClick={() => loadReport(range, token)}
          >
            <FileText className="h-4 w-4" />
            Load report
          </button>
          {report ? (
            <PDFDownloadLink
              document={<ClientReportDocument range={range} report={report} />}
              fileName={`mindwell-${range}-report.pdf`}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-2.5 font-label-md text-on-surface"
            >
              {({ loading: pdfLoading }) => (pdfLoading ? "Preparing PDF…" : "Export to PDF")}
            </PDFDownloadLink>
          ) : null}
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm text-on-surface-variant">
          {reportType === "DMS" ? "DMS ranges:" : "Medication ranges:"}
        </label>
        <select
          className="rounded-xl border border-outline-variant bg-background px-3 py-2 text-sm"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {(reportType === "DMS" ? dmsRanges : medicationRanges).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="relative col-span-12 flex flex-col gap-8 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm md:flex-row md:items-center md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 hidden h-64 w-64 rounded-full bg-secondary-container/20 blur-3xl md:block" aria-hidden />
          <div className="relative z-10 flex-1">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-outline-variant/50 bg-surface-variant px-3 py-1.5 font-label-sm text-on-surface-variant">
              <Sparkles className="h-4 w-4 text-secondary" />
              AI Generated Summary
            </div>
            <h2 className="mb-3 font-h2 text-h2 leading-tight text-on-background">
              {report?.metrics?.moodAverage != null
                ? `Your mood trend for this ${range} window aligns with your logged activity.`
                : "Overall wellbeing insights appear here after you load a report."}
            </h2>
            <p className="font-body-md leading-relaxed text-on-surface-variant">{insightText(report)}</p>
          </div>
        </div>

        <div className="col-span-12 flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm lg:col-span-8 lg:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-h3 text-h3 text-on-background">{isMedicationReport ? "Medication impact on DMS" : "DMS progression"}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                {isMedicationReport
                  ? "How adherence aligns with daily mood survey outcomes."
                  : "Self-reported daily mood survey pattern for this period."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block h-3 w-3 rounded-full bg-primary" />
              <span className="font-label-sm text-on-surface-variant">{isMedicationReport ? "Mood score" : "Mood average"}</span>
            </div>
          </div>
          <div className="min-h-[240px] rounded-lg border border-outline-variant/30 bg-background p-4">
            {!chartPoints.length ? (
              <p className="text-sm text-on-surface-variant">No data points for this range yet.</p>
            ) : (
              <div className="grid gap-2">
                {chartPoints.slice(-14).map((item) => (
                  <div key={item.label} className="grid grid-cols-[88px_1fr] items-center gap-3">
                    <span className="text-xs text-on-surface-variant">{item.label}</span>
                    <div className="space-y-1">
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(4, Math.min(100, (item.value / 10) * 100))}%` }}
                        />
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${isMedicationReport ? Math.max(2, Math.min(100, item.secondary)) : Math.max(4, Math.min(100, (item.secondary / 10) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 flex flex-col justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm lg:col-span-4 lg:p-8">
          <div>
            <h3 className="mb-1 font-h3 text-h3 text-on-background">
              {isMedicationReport ? "Medication Impact Score" : "DMS Quality Snapshot"}
            </h3>
            <p className="mb-6 text-sm text-on-surface-variant">
              {isMedicationReport ? "Derived only from medication adherence and DMS mood data" : "Detailed daily mood survey question quality"}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/30 bg-surface p-4">
            <p className="text-xs text-on-surface-variant">{isMedicationReport ? "Global impact score" : "Mood average"}</p>
            <p className="mt-1 text-3xl font-bold text-on-surface">
              {isMedicationReport ? report?.metrics?.medicationImpactScore ?? 0 : report?.metrics?.moodAverage ?? 0}
            </p>
          </div>
          <div className="mt-4 rounded-lg bg-surface p-4">
            {!isMedicationReport ? (
              <div className="space-y-2">
                {dmsQuestionRows.map((row) => (
                  <div key={row.key} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">{row.label}</span>
                    <span className="font-semibold text-on-surface">{dmsQuestionMetrics[row.key] ?? 0}/10</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-on-surface-variant">High adherence DMS avg</span>
                  <span className="font-semibold text-on-surface">{report?.metrics?.moodOnHighAdherenceDays ?? 0}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Low adherence DMS avg</span>
                  <span className="font-semibold text-on-surface">{report?.metrics?.moodOnLowAdherenceDays ?? 0}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Adherence-sensitive delta</span>
                  <span className="font-semibold text-on-surface">{report?.metrics?.adherenceSensitiveDelta ?? 0}</span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-start gap-3 rounded-lg bg-surface p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-tertiary" />
            <p className="text-sm text-on-surface-variant">
              Task completion remains a separate operational metric and is not used to calculate DMS or medication-effect report analytics.
            </p>
          </div>
        </div>
      </div>

      {isMedicationReport ? (
        <section className="mt-6 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
          <h3 className="font-h3 text-h3 text-on-surface">Per-medication impact map</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Each medication is mapped to adherence and same-day DMS mood outcomes.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {perMedication.map((item) => (
              <article key={item.medicationName} className="rounded-lg border border-outline-variant/30 bg-surface p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-on-surface">{item.medicationName}</h4>
                  <span className="text-xs text-on-surface-variant">{item.logs} logs</span>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">Impact score: {item.impactScore} | Overlap days: {item.overlapDays}</p>
                <div className="mt-3 space-y-1">
                  {(item.trend || []).slice(-7).map((t) => (
                    <p key={t.date} className="text-xs text-on-surface-variant">
                      {new Date(t.date).toLocaleDateString([], { month: "short", day: "numeric" })}: adherence {t.adherenceRate}% • mood {t.moodAverage}
                    </p>
                  ))}
                </div>
              </article>
            ))}
            {!perMedication.length ? (
              <p className="text-sm text-on-surface-variant">No medication-specific overlap with DMS was found in this range.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <details className="mt-6 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
        <summary className="cursor-pointer font-label-md text-on-surface">Raw report payload</summary>
        <pre className="mt-3 max-h-64 overflow-auto text-xs text-on-surface-variant">{JSON.stringify(report || {}, null, 2)}</pre>
      </details>

      {loading ? <p className="mt-4 text-sm text-primary">Syncing…</p> : null}
      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
