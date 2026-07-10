import type { AuditActivityItem } from "../application";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function targetLabel(item: AuditActivityItem) {
  return (
    item.taskName ??
    item.projectTitle ??
    item.departmentName ??
    item.resourceId ??
    item.resourceType
  );
}

export function AuditActivityPanel({ items }: { items: AuditActivityItem[] }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-main)]">
            Aktivitas Audit
          </h2>
          <p className="text-sm text-gray-500">
            Riwayat perubahan terbaru sesuai akses Anda.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
          Belum ada aktivitas audit pada scope ini.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{item.actorName}</span>{" "}
                  <span>{item.actionType.replaceAll("_", " ")}</span>{" "}
                  <span className="font-medium">{targetLabel(item)}</span>
                </p>
                <time className="text-xs text-gray-500">
                  {formatDate(item.createdAt)}
                </time>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {item.resourceType}
                {item.projectTitle ? ` · ${item.projectTitle}` : ""}
                {item.departmentName ? ` · ${item.departmentName}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
