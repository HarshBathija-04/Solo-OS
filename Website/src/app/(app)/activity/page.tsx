import { getActivityFeed, getRecentNotifications, getHeatmap } from "@/lib/player-data";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Coins, Activity as ActivityIcon, Bell, CalendarDays } from "lucide-react";
import { ActivityHeatmap } from "@/components/game/activity-heatmap";

export default async function ActivityPage() {
  const [feed, notifications, heatmap] = await Promise.all([
    getActivityFeed(),
    getRecentNotifications(undefined, 30),
    getHeatmap(undefined, 365),
  ]);
  const activities = feed.activities.slice(0, 30);
  const coins = feed.coins.slice(0, 20);

  // calculate total contributions for the year
  const totalContributions = heatmap.reduce((acc, cell) => acc + (cell.intensity > 0 ? cell.intensity : 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="sys-label">Insight</p>
        <h1 className="font-display text-2xl font-bold text-slate-100">Activity Log</h1>
      </div>

      <Panel>
        <PanelHeader label={`${totalContributions} contributions in the last year`} title="Activity Heatmap" right={<CalendarDays className="mr-4 mt-1 h-4 w-4 text-slate-500" />} />
        <div className="px-5 pb-5 pt-2">
          <ActivityHeatmap data={heatmap} />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader label="Timeline" title="System Events" right={<Bell className="mr-4 mt-1 h-4 w-4 text-slate-500" />} />
          <div className="max-h-[520px] space-y-2 overflow-y-auto p-4">
            {notifications.map((n) => (
              <div key={n.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-arc-blue">{n.title}</span>
                  <span className="font-mono text-[10px] text-slate-600">{n.createdAt.toLocaleString("en-IN")}</span>
                </div>
                {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader label="Economy" title="Coin Ledger" right={<Coins className="mr-4 mt-1 h-4 w-4 text-rank-gold" />} />
            <div className="max-h-[240px] space-y-1 overflow-y-auto p-4">
              {coins.map((c) => (
                <div key={c.id} className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-500">{c.reason} · {c.source || "—"}</span>
                  <span className={c.amount >= 0 ? "text-success" : "text-danger"}>
                    {c.amount >= 0 ? "+" : ""}{c.amount}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader label="Data" title="Metric Log" right={<ActivityIcon className="mr-4 mt-1 h-4 w-4 text-arc-cyan" />} />
            <div className="max-h-[240px] space-y-1 overflow-y-auto p-4">
              {activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-500">{a.kind}</span>
                  <span className="text-slate-300">{a.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
