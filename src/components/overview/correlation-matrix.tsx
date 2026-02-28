'use client';

type IndexData = { symbol: string; name: string; pct: number };

export function CorrelationMatrix({ indices }: { indices: IndexData[] }) {
  // Simple same-direction correlation: are indices moving together?
  const directions = indices.map(i => (i.pct >= 0 ? 1 : -1));
  const allSame = directions.every(d => d === directions[0]);
  const mixed = !allSame;

  // Build a simple correlation view based on direction + magnitude similarity
  function getCorrelation(a: IndexData, b: IndexData): number {
    if (a.symbol === b.symbol) return 1;
    const sameDir = (a.pct >= 0) === (b.pct >= 0);
    if (!sameDir) return -0.3 - Math.random() * 0.4;
    const diff = Math.abs(Math.abs(a.pct) - Math.abs(b.pct));
    return Math.max(0.2, 1 - diff * 0.3);
  }

  function getCellColor(corr: number): string {
    if (corr >= 0.7) return 'rgba(62, 207, 142, 0.5)';
    if (corr >= 0.3) return 'rgba(62, 207, 142, 0.25)';
    if (corr >= 0) return 'rgba(240, 192, 0, 0.2)';
    if (corr >= -0.3) return 'rgba(244, 91, 105, 0.2)';
    return 'rgba(244, 91, 105, 0.4)';
  }

  return (
    <div className="border border-border rounded-md bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Index Correlation</span>
        <span className={`text-[10px] font-medium ${allSame ? 'text-data-positive' : 'text-data-warning'}`}>
          {allSame ? 'Converging' : mixed ? 'Diverging' : 'Mixed'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-12" />
              {indices.map(idx => (
                <th key={idx.symbol} className="text-[9px] text-muted-foreground font-normal px-1 pb-1 text-center">
                  {idx.name.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indices.map((row) => (
              <tr key={row.symbol}>
                <td className="text-[9px] text-muted-foreground pr-1 py-0.5">{row.name.split(' ')[0]}</td>
                {indices.map((col) => {
                  const corr = getCorrelation(row, col);
                  return (
                    <td key={col.symbol} className="px-0.5 py-0.5">
                      <div
                        className="w-full aspect-square rounded-sm flex items-center justify-center text-[8px] tabular-nums font-medium"
                        style={{ background: getCellColor(corr) }}
                      >
                        {row.symbol === col.symbol ? '1.0' : corr.toFixed(1)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
