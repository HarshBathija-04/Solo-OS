import React from "react";

export interface HeatmapCell {
  date: string;
  intensity: number; // 0 to 4
}

export function ActivityHeatmap({ data }: { data: HeatmapCell[] }) {
  if (!data || data.length === 0) return null;

  // The Github colors
  const INTENSITY_COLORS = {
    0: "bg-white/[0.04]", // empty
    1: "bg-[#0e4429]",
    2: "bg-[#006d32]",
    3: "bg-[#26a641]",
    4: "bg-[#39d353]",
  } as const;

  // Pad the beginning so that the first day aligns with its day of the week.
  // 0 = Sunday, 1 = Monday...
  const firstCell = data[0];
  if (!firstCell) return null;
  const firstDate = new Date(firstCell.date);
  const startPad = firstDate.getDay(); 

  const paddedData = [
    ...Array(startPad).fill(null),
    ...data,
  ];

  // Group into columns of 7 days
  const weeks = [];
  for (let i = 0; i < paddedData.length; i += 7) {
    weeks.push(paddedData.slice(i, i + 7));
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabels: { label: string; colIndex: number }[] = [];
  let lastMonth = -1;
  
  weeks.forEach((week, colIndex) => {
    const firstValidDay = week.find((d) => d !== null);
    if (firstValidDay) {
      const m = new Date(firstValidDay.date).getMonth();
      if (m !== lastMonth) {
        // Prevent overlapping month labels by ensuring some distance
        const lastLabel = monthLabels[monthLabels.length - 1];
        if (!lastLabel || (colIndex - lastLabel.colIndex) > 2) {
          monthLabels.push({ label: months[m]!, colIndex });
          lastMonth = m;
        }
      }
    }
  });

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2 hide-scrollbar">
      <div className="inline-flex flex-col min-w-max">
        
        {/* Main Grid Row */}
        <div className="flex gap-2">
          {/* Day Labels */}
          <div className="flex flex-col gap-1 text-[10px] text-slate-500 pr-1 mt-[20px] items-end">
            <span style={{ height: '12px', visibility: 'hidden' }}>Sun</span>
            <span style={{ height: '12px', lineHeight: '12px' }}>Mon</span>
            <span style={{ height: '12px', visibility: 'hidden' }}>Tue</span>
            <span style={{ height: '12px', lineHeight: '12px' }}>Wed</span>
            <span style={{ height: '12px', visibility: 'hidden' }}>Thu</span>
            <span style={{ height: '12px', lineHeight: '12px' }}>Fri</span>
            <span style={{ height: '12px', visibility: 'hidden' }}>Sat</span>
          </div>

          <div className="flex flex-col">
            {/* Month Labels */}
            <div className="relative h-5 text-xs text-slate-400">
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  className="absolute bottom-1"
                  style={{ left: `${m.colIndex * 16}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return <div key={dIdx} className="w-3 h-3 rounded-sm opacity-0" />;
                    }
                    const level = Math.min(4, Math.max(0, day.intensity)) as keyof typeof INTENSITY_COLORS;
                    return (
                      <div
                        key={dIdx}
                        title={`${day.intensity > 0 ? day.intensity + ' contributions' : 'No contributions'} on ${day.date}`}
                        className={`w-3 h-3 rounded-[2px] transition hover:ring-1 hover:ring-slate-300 cursor-pointer ${INTENSITY_COLORS[level]}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pl-8">
          <span>Learn how we count contributions</span>
          <div className="flex items-center gap-1.5 pr-1">
            <span>Less</span>
            <div className={`w-3 h-3 rounded-[2px] ${INTENSITY_COLORS[0]}`} />
            <div className={`w-3 h-3 rounded-[2px] ${INTENSITY_COLORS[1]}`} />
            <div className={`w-3 h-3 rounded-[2px] ${INTENSITY_COLORS[2]}`} />
            <div className={`w-3 h-3 rounded-[2px] ${INTENSITY_COLORS[3]}`} />
            <div className={`w-3 h-3 rounded-[2px] ${INTENSITY_COLORS[4]}`} />
            <span>More</span>
          </div>
        </div>

      </div>
    </div>
  );
}
