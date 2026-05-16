export function StatCard({ label, value, tone = 'green' }: { label: string; value: string | number; tone?: 'green' | 'yellow' | 'red' }) {
  const color = tone === 'red' ? 'text-red-300' : tone === 'yellow' ? 'text-yellow-300' : 'text-shield-glow';
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-slate-300">{label}</p>
      <strong className={`mt-3 block text-3xl ${color}`}>{value}</strong>
    </div>
  );
}
