import { useMemo, useState } from "react";
import { FileText, Info, Sparkles, TrendingUp } from "lucide-react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ClientReportDocument from "../../reports/ClientReportDocument";

const ranges = ["daily", "weekly", "monthly", "yearly", "medication-impact"];

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
  const [range, setRange] = useState("monthly");
  const report = client.reports?.[range] || null;

  const taskPct = useMemo(() => {
    const done = client.tasks?.filter((t) => t?.completionStatus === "DONE").length || 0;
    const total = client.tasks?.length || 0;
    if (!total) return 0;
    return Math.min(100, Math.round((done / total) * 100));
  }, [client.tasks]);

  const circleOffset = useMemo(() => {
    const circumference = 2 * Math.PI * 45;
    return circumference - (taskPct / 100) * circumference;
  }, [taskPct]);

  return (
    <ClientShell title="Report Generation Center">
      <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 font-h1 text-h1 text-on-background">Report Generation</h1>
          <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
            Analyze your progress, review trends, and generate comprehensive PDF documentation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-surface-container-high p-1 shadow-inner">
            {quickRanges.map(({ value, label }) => (
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
            ))}
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
        <label className="text-sm text-on-surface-variant">All ranges:</label>
        <select
          className="rounded-xl border border-outline-variant bg-background px-3 py-2 text-sm"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {ranges.map((r) => (
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
              <h3 className="font-h3 text-h3 text-on-background">Mood Progression</h3>
              <p className="mt-1 text-sm text-on-surface-variant">Self-reported emotional baseline</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block h-3 w-3 rounded-full bg-primary" />
              <span className="font-label-sm text-on-surface-variant">Positive trend</span>
            </div>
          </div>
          <div className="relative min-h-[240px] w-full flex-1 border-b border-l border-outline-variant/30 pb-6">
            <div className="absolute -left-1 bottom-6 top-0 flex h-[calc(100%-24px)] flex-col justify-between text-xs text-outline">
              <span>High</span>
              <span>Neutral</span>
              <span>Low</span>
            </div>
            <div className="pointer-events-none absolute inset-0 bottom-6 flex flex-col justify-between pb-6">
              <div className="w-full border-t border-dashed border-outline-variant/30" />
              <div className="w-full border-t border-dashed border-outline-variant/30" />
              <div className="w-full border-t border-dashed border-outline-variant/30" />
            </div>
            <svg className="absolute inset-0 h-[calc(100%-24px)] w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="tealGradientReport" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,70 C20,65 30,80 50,40 C70,0 80,30 100,20 L100,100 L0,100 Z"
                fill="url(#tealGradientReport)"
                opacity="0.25"
              />
              <path
                className="text-primary drop-shadow-md"
                d="M0,70 C20,65 30,80 50,40 C70,0 80,30 100,20"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              <circle className="text-primary" cx="50" cy="40" fill="var(--color-surface-container-lowest)" r="3" stroke="currentColor" strokeWidth="2" />
              <circle className="text-primary" cx="100" cy="20" fill="var(--color-surface-container-lowest)" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex translate-y-full justify-between pt-2 text-xs text-outline">
              <span>Wk 1</span>
              <span>Wk 2</span>
              <span>Wk 3</span>
              <span>Wk 4</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 flex flex-col justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm lg:col-span-4 lg:p-8">
          <div>
            <h3 className="mb-1 font-h3 text-h3 text-on-background">Functional Output</h3>
            <p className="mb-6 text-sm text-on-surface-variant">Daily task completion rate</p>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle className="text-surface-container-high" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8" />
                <circle
                  className="text-secondary"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="45"
                  stroke="currentColor"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={circleOffset}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[32px] font-bold leading-none text-on-background">{taskPct}%</span>
                <span className="mt-1 flex items-center gap-0.5 font-label-sm text-secondary">
                  <TrendingUp className="h-3.5 w-3.5" />
                  tasks
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-lg bg-surface p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-tertiary" />
            <p className="text-sm text-on-surface-variant">
              Scores reflect tasks marked complete in your planner for the loaded session data.
            </p>
          </div>
        </div>
      </div>

      <details className="mt-6 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
        <summary className="cursor-pointer font-label-md text-on-surface">Raw report payload</summary>
        <pre className="mt-3 max-h-64 overflow-auto text-xs text-on-surface-variant">{JSON.stringify(report || {}, null, 2)}</pre>
      </details>

      {loading ? <p className="mt-4 text-sm text-primary">Syncing…</p> : null}
      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
