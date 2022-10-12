import { ethers, Transaction } from "ethers";

import {
  CHAIN_ID,
  CHAIN_NAME,
  CLEARING_HOUSE_ADDRESS,
  PRIVATE_KEY,
  RPC_URL,
  SUBGRAPH_ENDPOINT,
  AAPL_AMM,
  SHOP_AMM,
  AMD_AMM,
} from "../config";
import { facades } from "../helpers";
import fetch from "node-fetch";
import { sendAlert } from "../helpers";

export const payFunding = async (): Promise<Array<Transaction>> => {
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
  try {
    // const maintenanceMR = await contract.getMaintenanceMarginRatio();
    // console.log('maintenanceMarginRatio: ', maintenanceMR.toString());
    const amms = [AAPL_AMM, AMD_AMM, SHOP_AMM];
    let errMSG = "🆘 <b>PayFunding ERROR:</b>\n\n";
    for (const i in amms) {
      const amm = amms[i];
      try {
        await contract.payFunding(amm);
      } catch (err: any) {
        if (err.message.includes("settle funding too early")) {
          console.log(111111);
          continue;
        }
        const startSelector = err.message.search("reason");
        const endSelector = err.message.search("method");
        const reason = err.message.slice(startSelector + 7, endSelector - 2);
        errMSG += `\n\n<b>AMM</b>: ${amm}\n<b>Error</b>: ${reason}`;
        continue;
      }
    }
    if (errMSG.length > 50) {
      await sendAlert(errMSG);
    }
  } catch (err) {
    console.error(err);
  }
  return liquidatedTXs;
};
