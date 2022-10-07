import { ethers } from 'ethers';

export type address = string;

export enum Side {
  BUY = 0,
  SELL = 1
}

export type EthersProvider = ethers.Wallet | ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider;
export type EthersSigner = ethers.Wallet | ethers.providers.JsonRpcSigner;

/**
 * @notice This struct records personal position information
 * @param size denominated in amm.baseAsset
 * @param margin isolated margin
 * @param openNotional the quoteAsset value of position when opening position. the cost of the position
 * @param lastUpdatedCumulativePremiumFraction for calculating funding payment, record at the moment every time when trader open/reduce/close position
 * @param liquidityHistoryIndex
 * @param blockNumber the block number of the last position
 */
