import { getTodayFocusSessions } from "@/lib/player-data";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { FocusMode } from "@/components/game/focus-mode";

export default async function FocusPage() {
  const sessions = await getTodayFocusSessions();
  const todaySessions = sessions.filter((s) => s.endedAt !== null).length;
  const focusedMin = sessions.reduce((sum, s) => sum + (s.actualMin ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="sys-label">Core</p>
        <h1 className="font-display text-2xl font-bold text-slate-100">Focus Mode</h1>
        <p className="mt-1 text-sm text-slate-500">
          Today: {todaySessions} session{todaySessions === 1 ? "" : "s"} · {focusedMin} focused minutes
        </p>
      </div>

      <Panel glow>
        <PanelHeader label="Deep Work" title="Enter the Shaft" />
        <div className="p-6">
          <FocusMode />
        </div>
      </Panel>
    </div>
  );
}
