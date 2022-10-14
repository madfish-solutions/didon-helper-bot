import cors from "cors";
import express from "express";
import cron from "node-cron";
import { payFunding } from "./services/payFunding";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { version } from "../package.json";
import { BOT_TOKEN, SEVER_PORT } from "./config";
import { liquidate } from "./services/liquidate";
import { marketMake } from "./services/marketMake";
import { Telegraf } from "telegraf";
import fs from "fs";
import { checkPosition } from "./services/positionListener";
import { ammList } from "./helpers";

const bot = new Telegraf(BOT_TOKEN);

cron.schedule("* * * * *", async () => {
  console.log("Scheduled liquidations");
  await liquidate();
});

cron.schedule("* * * * *", async () => {
  console.log("Scheduled pay fungings");
  await payFunding();
  console.log("Completed!");
});

cron.schedule("*/30 * * * *", async () => {
  console.log("Market making");
  await marketMake();
  console.log("Completed!");
});

cron.schedule("* * * * *", async () => {
  console.log("Check positions");
  await checkPosition();
  console.log("Completed!");
});

bot.start(ctx => {
  const message = `Hello, ${ctx.from.first_name}!\nSend me your wallet address so I can track your positions.`;
  ctx.reply(message);
});
const regex = new RegExp(/0x\w*/);
bot.hears(regex, ctx => {
  const tgId = ctx.message.from.id.toString();
  const userIds: any[] = require("../userTgIds.json");
  const match: any = ctx.message.text.match(regex);
  const address = match[0].toLowerCase();
  console.log(ctx.from);
  const key = [tgId, address];

  let msg = "";

  const exists: any = userIds.find(
    userkey => userkey[0] === key[0] && userkey[1] === key[1],
  );

  if (exists) {
    msg = "Your wallet address was already registered.";
  } else {
    msg = `Good! Now your address is being tracked.`;
    userIds.push([tgId, address]);
    const traders = JSON.parse(JSON.stringify(require("../traders.json")));
    if (!traders[address]) {
      traders[address] = {
        [ammList[0]]: { lastMarginRatio: 0, lastNotificationTime: 0 },
        [ammList[1]]: { lastMarginRatio: 0, lastNotificationTime: 0 },
        [ammList[2]]: { lastMarginRatio: 0, lastNotificationTime: 0 },
      };
      fs.writeFileSync(`./traders.json`, JSON.stringify(traders));
    }
    fs.writeFileSync(`./userTgIds.json`, JSON.stringify(userIds));
  }

  ctx.reply(msg);
});
bot.launch();

const app = express();

app.use(cors());

// define a route handler
app.route("/").get(async (req, res) => {
  res.json({
    app: "Diodon",
    service: "Liquidator",
    status: "OK",
    status_code: 200,
    version,
  });
});

// Start the Express server
app.listen(SEVER_PORT, () => {
  const s = async () => {
    await liquidate();
  };
  s()
  console.log(`Server started at http://localhost:${SEVER_PORT}`);
});
