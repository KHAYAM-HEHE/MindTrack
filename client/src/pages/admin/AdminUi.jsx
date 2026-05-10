export function AdminSection({ title, subtitle, actions, children }) {
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-outline-variant/40 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-h3 text-on-surface">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AdminTable({ headers = [], children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="p-4 text-on-surface-variant font-label-sm uppercase tracking-wider border-b border-outline-variant/30"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-body-md">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminRow({ children }) {
  return <tr className="hover:bg-surface-container-low/50 transition-colors">{children}</tr>;
}

export function AdminCell({ className = "", children }) {
  return <td className={`p-4 text-on-surface ${className}`}>{children}</td>;
}

export function StatusPill({ value }) {
  const styles = {
    PENDING: "bg-tertiary-fixed text-on-tertiary-fixed",
    APPROVED: "bg-primary-fixed text-on-primary-fixed",
    REJECTED: "bg-error-container text-on-error-container",
    OPEN: "bg-tertiary-fixed text-on-tertiary-fixed",
    IN_REVIEW: "bg-secondary-fixed text-on-secondary-fixed-variant",
    IN_PROGRESS: "bg-surface-container-high text-on-surface",
    ESCALATED: "bg-secondary-container text-on-secondary-container",
    RESOLVED: "bg-primary-fixed text-on-primary-fixed",
    ACTIVE: "bg-primary-fixed text-on-primary-fixed",
    SUSPENDED: "bg-error-container text-on-error-container",
    BANNED: "bg-inverse-surface text-inverse-on-surface",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm uppercase ${styles[value] || "bg-surface-container-high text-on-surface-variant"}`}>
      {value || "UNKNOWN"}
    </span>
  );
}

export function AdminPrimaryButton({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm hover:bg-primary/90 transition-colors disabled:opacity-50 ${className}`}
    />
  );
}

export function AdminSecondaryButton({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={`px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface font-label-sm hover:bg-surface-container-low transition-colors disabled:opacity-50 ${className}`}
    />
  );
}

export function AdminTextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${props.className || ""}`}
    />
  );
}

export function AdminSelect(props) {
  return (
    <select
      {...props}
      className={`rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${props.className || ""}`}
    />
  );
}

export function AdminPagination({ page, limit, total, onPage, loading }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  return (
    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
      <AdminSecondaryButton type="button" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}>
        Previous
      </AdminSecondaryButton>
      <span>
        Page {page} of {pages}
      </span>
      <AdminSecondaryButton type="button" disabled={page >= pages || loading} onClick={() => onPage(page + 1)}>
        Next
      </AdminSecondaryButton>
    </div>
  );
}

