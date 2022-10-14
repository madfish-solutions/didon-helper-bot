import { ethers } from "ethers";

import {
  CHAIN_ID,
  CHAIN_NAME,
  CLEARING_HOUSE_ADDRESS,
  PRIVATE_KEY,
  RPC_URL,
} from "../config";
import {
  ammList,
  facades,
  getSide,
  priceKeys,
  sendForSubrscribers,
} from "../helpers";

import fs from "fs";

export const GET_ALL_POSITIONS = () => `query {
  positions(orderBy: date, orderDirection: desc, first:1000) {
    id
    trader
    amm
    margin
    positionNotional
  }
}`;
/*
  1 - 5h
  2 - 2h
  3 - 1h
  4 - 0.5h
 */
const intervals: any = {
  "1": 18000 * 1000,
  "2": 7200 * 1000,
  "3": 3600 * 1000,
  "4": 1800 * 1000,
};

export type userInfo = {
  lastMarginRatio: string;
  lastNotificationTime: number;
};
export const checkPosition = async (): Promise<any> => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
    name: CHAIN_NAME,
    chainId: CHAIN_ID,
  });

  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const clearingHouse = new facades.ClearingHouse(
    provider,
    CLEARING_HOUSE_ADDRESS,
    wallet,
  );
  const traders = JSON.parse(JSON.stringify(require("../../traders.json")));
  const traderList = Object.keys(traders);
  try {
    for (const i in traderList) {
      const traderAddr = traderList[i];

      for (const x in ammList) {
        const amm = ammList[x];
        const trader: userInfo = traders[traderAddr.toLocaleLowerCase()][amm];
        const position = await clearingHouse.contract.getPosition(
          amm,
          traderAddr,
        );

        if (position.size.toString() == 0) continue;

        const marginRatio = (
          await clearingHouse.getMarginRatio(amm, traderAddr)
        ).toNumber();

        const formatedMarginRatio = (marginRatio / 10 ** 18).toFixed(2);

        let msg = `💳 <b>Account</b>: ${traderAddr}\n\n${getSide(
          position.size.toString(),
        )} <b>${priceKeys[amm.toLowerCase()]}</b>`;
        let marginRisk = 0;

        if (marginRatio > 0.15e18) continue;
        if (marginRatio >= 0.1e18 && marginRatio < 0.15e18) {
          msg += `\n\n⚠️ <b>Medium risk</b>:\nYour margin level on has fallen below <b>15%</b>, keep your margin ratio above <b>6.25%</b> to avoid <b>liquidation</b>.`;
          marginRisk = 1;
        } else if (marginRatio >= 0.08e18 && marginRatio < 0.1e18) {
          marginRisk = 2;
          msg += `\n\n⚠️⚠️ <b>High risk</b>: Your margin level has fallen below <b>10%</b>.\nClose your position, otherwise, we'll have to take steps to help you.`;
        } else if (marginRatio >= 0.066e18 && marginRatio < 0.08e18) {
          marginRisk = 3;
          msg += `\n\n♨️ <b>Critical risk</b>: Your margin level has fallen below <b>8%</b>.\n make sure you get stable margin from borrowing liquid assets like dDAI. If you don't add stable capital, an <b>auto liquidation</b> order might be triggered soon.`;
        } else {
          marginRisk = 4;
          msg += `\n\n🆘 <b>!!CRITICAL RISK!!</b> 🆘\n\nYour margin level has fallen  below <b>6.6%</b>.\n\n<b>You will be liquidated</b> when your percentage drops below <b>6.25%</b>`;
        }

        const lastUpdate: number = trader.lastNotificationTime;

        const timeDiff = Date.now() - lastUpdate;
        const interval = intervals[marginRisk.toString()];
        console.log("interval", timeDiff >= interval);
        if (timeDiff >= intervals[marginRisk.toString()]) {
          console.log(Date.now(), Date.now());
          trader.lastNotificationTime = Date.now();
          trader.lastMarginRatio = formatedMarginRatio.toString();
          await sendForSubrscribers(traderAddr, msg);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
  fs.writeFileSync(`./traders.json`, JSON.stringify(traders));
  let returnPositions: any = [];

  return returnPositions;
};
