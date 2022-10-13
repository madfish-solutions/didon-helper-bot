import { ethers } from 'ethers';

import {
  CHAIN_ID,
  CHAIN_NAME,
  CLEARING_HOUSE_ADDRESS,
  PRIVATE_KEY,
  RPC_URL,
  AAPL_AMM,
  SHOP_AMM,
  AMD_AMM,
  AMM_READER_ADDRESS,
  PRICE_FEED_ADDRESS
} from '../config';
import { facades } from '../helpers';
import { sendAlert } from '../helpers';
import ammReaderABI from '../abis/ammReader.json';
import BigNumber from 'bignumber.js';
import { Side } from '../helpers/types';

const PRECISION = 1e18;
export const marketMake = async () => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
    name: CHAIN_NAME,
    chainId: CHAIN_ID
  });
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new facades.ClearingHouse(provider, CLEARING_HOUSE_ADDRESS, wallet);
  const priceFeed = new facades.ChainlinkPriceFeed(provider, PRICE_FEED_ADDRESS, wallet);
  const ammReader = new facades.CommonFacade(provider, AMM_READER_ADDRESS, ammReaderABI, wallet);
  try {
    const amms = [
      [AAPL_AMM, 'aapl'],
      [AMD_AMM, 'amd'],
      [SHOP_AMM, 'shop']
    ];

    const amm = new facades.Amm(provider, SHOP_AMM, wallet);
    const quouteToken = await amm.contract.quoteAsset();
    const erc20 = new facades.ERC20(provider, quouteToken, wallet);

    for (const i in amms) {
      const amm = amms[i][0];
      const priceFeedKey = amms[i][1];
      const ammState = await ammReader.contract.getAmmStates(amm);
      const indexPrice = await priceFeed.getPrice(priceFeedKey);
      const marketPrice = new BigNumber(ammState.quoteAssetReserve.toString() / ammState.baseAssetReserve.toString());
      const newBaseReserve = Math.floor((ammState.quoteAssetReserve.toString() / indexPrice.toString()) * PRECISION);

      let diff = new BigNumber(newBaseReserve - ammState.baseAssetReserve.toString());

      let side = Side.BUY;
      let sideName = 'Buy';
      if (diff > new BigNumber(0)) {
        side = Side.SELL;
        sideName = 'Sell';
      } else {
        diff = diff.abs();
      }
      console.log('difff', diff.toFixed());
      console.log(sideName);

      try {
        await erc20.decreaseAllowance(contract.contract.address);
        let amount = diff.div(3).multipliedBy(marketPrice).integerValue(BigNumber.ROUND_DOWN);
        await erc20.increaseAllowance(contract.contract.address, amount.plus(100 * PRECISION));
        const prePosition = await contract.contract.getPosition(amm, wallet.address);
        console.log('PreSize: ', prePosition.size.toString() / 10 ** 18);
        console.log('Margin', prePosition.margin.toString() / 10 ** 18);

        try {
          await contract.openPosition(
            amm,
            side,
            amount.integerValue(BigNumber.ROUND_FLOOR),
            new BigNumber(2 * PRECISION),
            new BigNumber(0 * PRECISION)
          );
        } catch (err: any) {
          if (err.message.includes('price is over fluctuation limit')) {
            try {
              await contract.openPosition(
                amm,
                side,
                new BigNumber(50000 * PRECISION),
                new BigNumber(2 * PRECISION),
                new BigNumber(0 * PRECISION)
              );
            } catch (err: any) {
              const startSelector = err.message.search('reason');
              const endSelector = err.message.search('method');
              const reason = err.message.slice(startSelector + 7, endSelector - 2);
              await sendAlert(`🆘 OpenPosition\n${priceFeedKey}\n\n${reason}`);
            }
          }
        }
        const postPosition = await contract.contract.getPosition(amm, wallet.address);
        console.log('NewSize: ', postPosition.size.toString() / 10 ** 18);
        console.log('NewMargin: ', postPosition.margin.toString() / 10 ** 18);
        console.log('TradeAmount: ', amount.div(10 ** 18).toFixed());
      } catch (err: any) {
        const startSelector = err.message.search('reason');
        const endSelector = err.message.search('method');
        const reason = err.message.slice(startSelector + 7, endSelector - 2);
        await sendAlert(`🆘 OpenPosition\n${priceFeedKey}\n\n${reason}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
  console.log('MM completed');
};
