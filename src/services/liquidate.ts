import { ethers, Transaction } from 'ethers';

import { CHAIN_ID, CHAIN_NAME, CLEARING_HOUSE_ADDRESS, PRIVATE_KEY, RPC_URL, SUBGRAPH_ENDPOINT } from '../config';
import { ammList, facades, getSide, priceKeys, sendForSubrscribers, sendLiquidation} from '../helpers';
import fetch from 'node-fetch';
import { sendAlert } from '../helpers';

import fs from 'fs';
import BigNumber from 'bignumber.js';
import { address } from 'helpers/types';
import { ClearingHouse } from 'helpers/facades';

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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query })
  });
  const data: any = await resp.json();
  if (data.errors) {
    console.error({
      event: 'GraphQueryError',
      params: {
        err: new Error('GraphQueryError'),
        errors: data.errors
      }
    });
  }

  return data;
};

const getFilteredPositions = async (clearingHouse: ClearingHouse): Promise<any> => {
  const rawPositions = await querySubgraph(GET_ALL_POSITIONS());
  console.log(rawPositions.data.positions.length);
  const traders: address[] = [];
  for (const position of rawPositions.data.positions) {
    if (!ammList.includes(position.amm.toLowerCase())) continue;

    const liquidatedPositions = JSON.parse(JSON.stringify(require('../../liquidatedPositions.json')));
    if (liquidatedPositions[position.id.toLowerCase()] !== undefined) {
      continue;
    }

    if (traders.includes(position.trader.toLowerCase())) continue;
    traders.push(position.trader.toLowerCase());
  }

  let returnPositions: any = [];
  console.log("traders: ", traders.length);
  for (const i in traders) {
    const trader = traders[i];
    for (const i in ammList) {
      const amm = ammList[i];
      const position = await clearingHouse.contract.getPosition(amm, trader);
      if (position.size.toString() == 0) continue;
      returnPositions.push({
        trader: trader,
        amm: amm,
        side: getSide(position.size.toString()),
        size: position.size.toString(),
        positionNotional: position.openNotional.toString(),
      });
    }
  }

  console.log('UpdatedPositions :', returnPositions.length);
  return returnPositions;
};

export const liquidate = async () => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
    name: CHAIN_NAME,
    chainId: CHAIN_ID
  });
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new facades.ClearingHouse(provider, CLEARING_HOUSE_ADDRESS, wallet);

  let liquidatedPositions = JSON.parse(JSON.stringify(require('../../liquidatedPositions.json')));
  let ammNotf = 0;
  try {
    const positions = await getFilteredPositions(contract);
    let errMessage = '🆘\n\n';

    let cache = JSON.parse(JSON.stringify(require('../../logs.json')));
    for (const position of positions) {
      try {
        console.log(
          `\nLiquidate: ${position.side} AMM ${priceKeys[position.amm.toLowerCase()]}: ${position.amm}, trader: ${
            position.trader
          }\n`
        );

        const tx = await contract.liquidateWithSlippage(position.amm, position.trader, new BigNumber(0));
        console.log(`\nLiquidation successful: ${tx.hash}\n`);
        liquidatedPositions[tx.hash!.toLowerCase()] = position;
        await sendLiquidation(
          `❌ <b>Liquidated</b>\n\n${position.side} <b>${
            priceKeys[position.amm.toLowerCase()]
          }</b>\n<b>Amount</b>: ${
            position.positionNotional / 10 ** 18
          } USD\n<b>Trader</b>: ${position.trader}\n\n\🧾 <code>${
            tx.hash
          }</code>`,
        );
        const msgForSubs = `❌ <b>Your position was Liquidated</b>\n\n${
          position.side
        } ${priceKeys[position.amm.toLowerCase()]}\n<b>Amount</b>: ${
          position.positionNotional / 10 ** 18
        } USD\n<b>Address</b>: ${position.trader}\n\n\🧾 <code>${
          tx.hash
        }</code>`;
        await sendForSubrscribers(position.trader, msgForSubs);
      } catch (err: any) {
        const startSelector = err.message.search('reason');
        const endSelector = err.message.search('method');
        const reason = err.message.slice(startSelector + 7, endSelector - 2);

        if (reason === 'execution reverted: Margin ratio not meet criteria') {
          ammNotf += 1;
        }
        if (
          err.message.search('amm not found') != 1 ||
          err.message.search('positionSize is 0') != -1 ||
          err.message.search('Margin ratio not meet criteria') != -1
        ) {
          continue;
        } else {
          if (position.id in cache) {
            continue;
          }

          const startSelector = err.message.search('reason');
          const endSelector = err.message.search('method');
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

              errMessage = '';
            }
          }

          continue;
        }
      }
    }
    fs.writeFileSync(`./liquidatedPositions.json`, JSON.stringify(liquidatedPositions));

    console.log(ammNotf);
  } catch (err) {
    console.error(err);
  }
};
