export function DataTable<T extends Record<string, any>>({ rows, columns }: { rows: T[]; columns: { key: keyof T; label: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl glass">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-left text-slate-300">
          <tr>{columns.map(column => <th className="px-4 py-3" key={String(column.key)}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-t border-white/10" key={row.id || index}>
              {columns.map(column => <td className="px-4 py-3" key={String(column.key)}>{String(row[column.key] ?? '-')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
