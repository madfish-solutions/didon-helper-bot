import { ethers, Transaction } from "ethers";

import {
  CHAIN_ID,
  CHAIN_NAME,
  CLEARING_HOUSE_ADDRESS,
  PRIVATE_KEY,
  RPC_URL,
  SUBGRAPH_ENDPOINT,
} from "../config";
import { facades } from "../helpers";
import fetch from "node-fetch";
import { sendAlert } from "../helpers";

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

export const querySubgraph = async (query: string): Promise<any> => {
  const resp = await fetch(SUBGRAPH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const data: any = await resp.json();
  if (data.errors) {
    console.error({
      event: "GraphQueryError",
      params: {
        err: new Error("GraphQueryError"),
        errors: data.errors,
      },
    });
  }

  return data;
};

export const liquidate = async (): Promise<Array<Transaction>> => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
    name: CHAIN_NAME,
    chainId: CHAIN_ID,
  });
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new facades.ClearingHouse(
    provider,
    CLEARING_HOUSE_ADDRESS,
    wallet,
  );
  const liquidatablePositions: Array<string> = [];
  const liquidatedTXs: Array<Transaction> = [];
  const errors: Array<string> = [];
  let ammNotf = 0;
  try {
    // const maintenanceMR = await contract.getMaintenanceMarginRatio();
    // console.log('maintenanceMarginRatio: ', maintenanceMR.toString());
    const positions = await querySubgraph(GET_ALL_POSITIONS());
    let errMessage = "🆘\n\n";
    console.log(positions.data.positions.length);

    let cache = JSON.parse(JSON.stringify(require("../../logs.json")));
    for (const position of positions.data.positions) {
      try {
        liquidatablePositions.push(position.id);
        console.log(
          `\nLiquidate: ${position.id} AMM: ${position.amm}, trader: ${position.trader}\n`,
        );
        const tx = await contract.liquidate(position.amm, position.trader);
        console.log(`\nLiquidation successful: ${tx.hash}\n`);
        liquidatedTXs.push(tx);
      } catch (err: any) {
        const startSelector = err.message.search("reason");
        const endSelector = err.message.search("method");
        const reason = err.message.slice(startSelector + 7, endSelector - 2);

        if (reason === "execution reverted: Margin ratio not meet criteria") {
          ammNotf += 1;
        }
        if (
          err.message.search("amm not found") != 1 ||
          err.message.search("positionSize is 0") != -1 ||
          err.message.search("Margin ratio not meet criteria") != -1
        ) {
          continue;
        } else {
          if (position.id in cache) {
            continue;
          }

          const startSelector = err.message.search("reason");
          const endSelector = err.message.search("method");
          const reason = err.message.slice(startSelector + 7, endSelector - 2);

          cache[position.id] = reason;

          fs.writeFileSync(`./logs.json`, JSON.stringify(cache));
          const msg = `\n<b>Reason</b>: ${reason}\n<b>PositionId</b>: ${position.id}\n<b>AMM</b>: ${position.amm}\n<b>Trader:</b> ${position.trader}\n`;
          if (errMessage.length < 4000) {
            const preErrMessage = errMessage;
            errMessage += msg;

            if (errMessage.length >= 4000) {
              await sendAlert(preErrMessage);
              await sendAlert(msg);

              errMessage = "";
            }
          }

          continue;
        }
      }
    }
    // console.log(`All positions: ${positions.data.positions.length}`);
    // for (const position of positions.data.positions) {
    //   try {
    //     const positionMR = await contract.getMarginRatio(position.amm, position.trader);
    //     const isLiquidable = positionMR.lt(maintenanceMR);
    //     console.log(`AMM: ${position.amm}, trader: ${position.trader}: `, positionMR.toString());
    //     console.log(`Liquidatable: ${isLiquidable ? '\x1B[32m' : '\x1B[31m'}${isLiquidable}\x1b[0m`);
    //     if (isLiquidable) {
    //       liquidatablePositions.push(position.id);
    //       console.log(`\nLiquidate: ${position.id} AMM: ${position.amm}, trader: ${position.trader}\n`);
    //       try {
    //         const tx = await contract.liquidate(position.amm, position.trader);
    //         console.log(`\nLiquidation successful: ${tx.hash}\n`);
    //         liquidatedTXs.push(tx);
    //       } catch (err) {
    //         console.error(`can't liquidate. `, err);
    //         continue;
    //       }
    //     }
    //   } catch (err: any) {
    //     console.log(err)
    //     continue;
    //   }
    // }
    console.log(`Liquidatable positions: ${liquidatablePositions.length}`);
    console.log(`Liquidated positions: ${liquidatedTXs.length}`);
    console.log(ammNotf);
  } catch (err) {
    console.error(err);
  }
  return liquidatedTXs;
};
