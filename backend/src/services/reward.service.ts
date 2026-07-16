/**
 * Reward economy: purchases go through the transactional `purchase_reward`
 * RPC (the one true transaction in the old code); reward creation is a plain insert.
 */
import { db } from "../db/supabase.js";
import { AppError } from "../middleware/error.js";

export async function purchaseReward(userId: string, rewardId: string) {
  const { data, error } = await db.rpc("purchase_reward", {
    p_user_id: userId,
    p_reward_id: rewardId,
  });
  if (error) {
    if (error.message.includes("Reward not found")) throw new AppError("Reward not found", 404);
    if (error.message.includes("Not enough coins")) throw new AppError("Not enough coins", 400);
    throw new Error(error.message);
  }
  return data as { ok: boolean; balance: number };
}

export async function createReward(params: {
  userId: string;
  title: string;
  description: string;
  cost: number;
  icon?: string;
}) {
  const { userId, title, description, cost, icon = "gift" } = params;
  const { data, error } = await db
    .from("rewards")
    .insert({
      user_id: userId, title, description,
      cost: Math.max(1, Math.round(cost)), icon, custom: true,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
