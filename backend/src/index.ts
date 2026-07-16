import { createApp } from "./app.js";
import { config } from "./config.js";
import { registerDailyQuestCron } from "./cron/daily-quests.js";

const app = createApp();

app.listen(config.PORT, () => {
  console.log(`ARISE//OS backend listening on :${config.PORT}`);
  if (config.CRON_ENABLED) {
    registerDailyQuestCron();
    console.log("Daily-quest cron registered (00:00 IST)");
  }
});
