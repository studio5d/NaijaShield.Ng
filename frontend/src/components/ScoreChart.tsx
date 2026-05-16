import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function ScoreChart({ data }: { data: { score: number; calculatedAt: string }[] }) {
  const rows = data.map(item => ({ ...item, date: new Date(item.calculatedAt).toLocaleDateString() }));
  return (
    <div className="h-72 rounded-2xl glass p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <XAxis dataKey="date" stroke="#9fb3d9" />
          <YAxis stroke="#9fb3d9" domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#00ff99" strokeWidth={3} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
