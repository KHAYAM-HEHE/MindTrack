export function TemplateWorkspace({ Template, title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </header>
      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="overflow-hidden rounded-lg border bg-white">
          <Template />
        </section>
        <aside className="rounded-lg border bg-white p-4">{children}</aside>
      </div>
    </div>
  );
}

export function JsonBlock({ title, data }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <pre className="max-h-56 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

