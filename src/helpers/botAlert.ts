import { Telegraf } from "telegraf";

import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "..", "..", ".env") });
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN!);

export async function sendAlert(msg: string) {
  console.log(msg);
  // bot.telegram.sendMessage(process.env.ALERT_GROUP!, msg, {
  //   parse_mode: "HTML",
  // });
}

async function main(): Promise<void> {
  await sendAlert("huy");
}
