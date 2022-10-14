import { config } from 'dotenv';

import { defined } from './helpers';

config();

// Blockchain
export const RPC_URL = defined(process.env.RPC_URL);
export const CHAIN_ID = Number(defined(process.env.CHAIN_ID));
export const CHAIN_NAME = defined(process.env.CHAIN_NAME);
export const AAPL_AMM = defined(process.env.AAPL_AMM)
export const AMD_AMM = defined(process.env.AMD_AMM);
export const SHOP_AMM = defined(process.env.SHOP_AMM);

// Wallet Diodon Bot
export const PRIVATE_KEY = defined(process.env.PRIVATE_KEY);

// Express Server
export const SEVER_PORT = process.env.PORT || 3000;

export const SUBGRAPH_ENDPOINT = defined(process.env.SUBGRAPH_ENDPOINT);

export const CLEARING_HOUSE_ADDRESS = defined(process.env.CLEARING_HOUSE_ADDRESS);
export const CLEARING_HOUSE_VIEWER_ADDRESS = defined(process.env.CLEARING_HOUSE_VIEWER_ADDRESS);
export const AMM_READER_ADDRESS = defined(process.env.AMM_READER_ADDRESS);
export const PRICE_FEED_ADDRESS = defined(process.env.PRICE_FEED_ADDRESS);

export const BOT_TOKEN = defined(process.env.BOT_TOKEN);