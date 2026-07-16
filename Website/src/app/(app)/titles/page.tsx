import { getTitlesData } from "@/lib/player-data";
import { TITLES } from "@/lib/game-engine/content/titles";
import { TitleList, type TitleVM } from "./title-list";

export default async function TitlesPage() {
  const { owned, equippedTitleId } = await getTitlesData();
  const ownedByKey = new Map(owned.map((t) => [t.key, t]));

  const vms: TitleVM[] = TITLES.map((def) => {
    const o = ownedByKey.get(def.key);
    return {
      id: o?.id ?? `locked:${def.key}`,
      name: def.name,
      description: def.description,
      rarity: def.rarity,
      xpBonusPct: def.xpBonusPct,
      owned: !!o,
    };
  }).sort((a, b) => Number(b.owned) - Number(a.owned));

  return (
    <div className="space-y-6">
      <div>
        <p className="sys-label">Progression</p>
        <h1 className="font-display text-2xl font-bold text-slate-100">Titles</h1>
        <p className="mt-1 text-sm text-slate-500">Earned through achievements and bosses. Equip one — some grant a small XP bonus.</p>
      </div>
      <TitleList titles={vms} equippedId={equippedTitleId} />
    </div>
  );
}
