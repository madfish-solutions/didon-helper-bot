import { ethers } from "ethers";
import { address, EthersProvider } from "../types";
import { BigNumber } from "bignumber.js";
import { CommonFacade } from "./common";
import priceFeedABI from "../../abis/ChainlinkPriceFeed.json";

export class ChainlinkPriceFeed extends CommonFacade {
  constructor(
    provider: EthersProvider,
    contractAddress: address,
    signer: ethers.Wallet,
  ) {
    super(provider, contractAddress, priceFeedABI, signer);
  }

  /**
   * @param priceFeedKey currency (aapl, amd)
   * @returns price of the currency in USD (18 decimals)
   */
  public async getPrice(priceFeedKey: string) {
    return await this.contract.getPrice(
      ethers.utils.formatBytes32String(priceFeedKey.toUpperCase()),
    );
  }

  public async getTwapPrice(priceFeedKey: string, interval: number) {
    return await this.contract.getTwapPrice(
      ethers.utils.formatBytes32String(priceFeedKey.toUpperCase()),
      interval,
    );
  }

  /**
   * @param priceFeedKey currency (aapl, amd)
   * @param addr address of the chainlink oracle
   */
  public async addAggregator(priceFeedKey: string, addr: address) {
    return await this.contract
      .connect(this.signer)
      .addAggregator(ethers.utils.formatBytes32String(priceFeedKey), addr, {
        gasLimit: 1000000,
      });
  }

  /**
   * @param priceFeedKey currency (aapl, amd)
   */
  public async removeAggregator(priceFeedKey: string) {
    return await this.contract
      .connect(this.signer)
      .removeAggregator(ethers.utils.formatBytes32String(priceFeedKey));
  }

  /**
   * @param priceFeedKey currency (aapl, amd)
   * @returns address of the chainlink oracle
   */
  public async getAggregator(priceFeedKey: string) {
    return await this.contract.getAggregator(
      ethers.utils.formatBytes32String(priceFeedKey),
    );
  }

  /**
   * @param priceFeedKey currency (aapl, amd)
   * @param numOfRoundBack number of round back to get the price
   * @returns uint256 price of the currency in USD (18 decimals)
   * @dev numOfRoundBack = 0 means the latest round
   */
  public async getPreviousPrice(priceFeedKey: string, numOfRoundBack: number) {
    return await this.contract.getPreviousPrice(
      ethers.utils.formatBytes32String(priceFeedKey.toUpperCase()),
      numOfRoundBack,
    );
  }

  /**
   * @param priceFeedKey currency (aapl, amd)
   * @returns uint256 length of the price feed map
   */
  public async getPriceFeedMapLength(priceFeedKey: string) {
    return await this.contract.getPriceFeedMapLength(
      ethers.utils.formatBytes32String(priceFeedKey.toUpperCase()),
    );
  }
}
