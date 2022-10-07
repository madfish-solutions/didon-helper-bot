import { ethers, Transaction } from 'ethers';

import { CHAIN_ID, CHAIN_NAME, CLEARING_HOUSE_ADDRESS, PRIVATE_KEY, RPC_URL, SUBGRAPH_ENDPOINT } from '../config';
import { facades } from '../helpers';

export const GET_ALL_POSITIONS = () => `query {
  positions(orderBy: date, orderDirection: desc) {
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
  const data = await resp.json();
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

export const liquidate = async (): Promise<Array<Transaction>> => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
    name: CHAIN_NAME,
    chainId: CHAIN_ID
  });
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new facades.ClearingHouse(provider, CLEARING_HOUSE_ADDRESS, wallet);
  const liquidatablePositions: Array<string> = [];
  const liquidatedTXs: Array<Transaction> = [];
  try {
    const maintenanceMR = await contract.getMaintenanceMarginRatio();
    console.log('maintenanceMarginRatio: ', maintenanceMR.toString());
    const positions = await querySubgraph(GET_ALL_POSITIONS());
    console.log(`All positions: ${positions.data.positions.length}`);
    for (const position of positions.data.positions) {
      try {
        const positionMR = await contract.getMarginRatio(position.amm, position.trader);
        const isLiquidable = positionMR.lt(maintenanceMR);
        console.log(`AMM: ${position.amm}, trader: ${position.trader}: `, positionMR.toString());
        console.log(`Liquidatable: ${isLiquidable ? '\x1B[32m' : '\x1B[31m'}${isLiquidable}\x1b[0m`);
        if (isLiquidable) {
          liquidatablePositions.push(position.id);
          console.log(`\nLiquidate: ${position.id} AMM: ${position.amm}, trader: ${position.trader}\n`);
          try {
            const tx = await contract.liquidate(position.amm, position.trader);
            console.log(`\nLiquidation successful: ${tx.hash}\n`);
            liquidatedTXs.push(tx);
          } catch (err) {
            console.error(`can't liquidate. `, err);
            continue;
          }
        }
      } catch (err: any) {
        if (err.reason !== 'positionSize is 0') {
          console.error(err);
        }
        continue;
      }
    }
    console.log(`Liquidatable positions: ${liquidatablePositions.length}`);
    console.log(`Liquidated positions: ${liquidatedTXs.length}`);
  } catch (err) {
    console.error(err);
  }
  return liquidatedTXs;
};
