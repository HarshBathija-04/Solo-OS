import { Panel, PanelHeader } from "@/components/ui/panel";
import { getTimetableData } from "@/lib/player-data";
import { TimetableBoard, type ClientBlock } from "@/components/game/timetable-board";
import type { TimetableDayType } from "@/lib/game-types";

export const dynamic = "force-dynamic";

const DAY_PARAM_MAP: Record<string, Exclude<TimetableDayType, "ALL">> = {
  office: "OFFICE",
  wfh: "WFH",
  weekend: "WEEKEND",
};

/** Default variant: WEEKEND on Sat/Sun (Asia/Kolkata), OFFICE otherwise. */
function defaultDayType(): Exclude<TimetableDayType, "ALL"> {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  }).format(new Date());
  return weekday === "Sat" || weekday === "Sun" ? "WEEKEND" : "OFFICE";
}

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  const dayType = DAY_PARAM_MAP[day?.toLowerCase() ?? ""] ?? defaultDayType();

  const { blocks, states, excuses } = await getTimetableData(dayType);

  const clientBlocks: ClientBlock[] = blocks.map((b) => ({
    id: b.id,
    order: b.order,
    startHour: b.startHour,
    startMin: b.startMin,
    endHour: b.endHour,
    endMin: b.endMin,
    activity: b.activity,
    category: b.category,
    xpReward: b.xpReward,
    dayType: (b.dayType ?? "ALL") as ClientBlock["dayType"],
    state: (states[b.id] ?? "UPCOMING") as ClientBlock["state"],
    excuseReason: excuses[b.id],
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="sys-label">Core</p>
        <h1 className="font-display text-2xl font-bold text-slate-100">Timetable</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your daily schedule with office, WFH and weekend variants. Start a block to log it and
          earn XP.
        </p>
      </div>

      <Panel glow>
        <PanelHeader label="Schedule" title="Today's Timeline" />
        <div className="p-4 sm:p-6">
          <TimetableBoard key={dayType} initialBlocks={clientBlocks} dayType={dayType} />
        </div>
      </Panel>
    </div>
  );
}
