import { Telegraf } from "telegraf";

import dotenv from "dotenv";
import { resolve } from "path";
import { getTgIdsFromAddress } from "./";
dotenv.config({ path: resolve(__dirname, "..", "..", ".env") });
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN!);

export async function sendAlert(msg: string) {
  try {
    await bot.telegram.sendMessage(process.env.ALERT_GROUP!, msg, {
      parse_mode: "HTML",
    });
  } catch (err) {
    console.log(err);
  }
}

export async function sendLiquidation(msg: string) {
  try {
    await bot.telegram.sendMessage(process.env.LIQUIDATION_GROUP!, msg, {
      parse_mode: "HTML",
    });
  } catch (err) {
    console.log(err);
  }
}

export async function sendForSubrscribers(trader: string, msg: string) {
  const userIds: any = getTgIdsFromAddress(trader);
  const tempIds: any = [];
  for (const user of userIds) {
    try {
      const tgId = user[0];
      if (tempIds.includes(tgId)) continue;

      await bot.telegram.sendMessage(tgId, msg, {
        parse_mode: "HTML",
      });
      tempIds.push(tgId);
    } catch (err) {
      console.log(err);
    }
  }
}
