import { ethers } from "ethers";
import { address, EthersProvider } from "../types";
import { BigNumber } from "bignumber.js";
import { CommonFacade } from "./common";
import ammABI from "../../abis/amm.json";

export class Amm extends CommonFacade {
  constructor(
    provider: EthersProvider,
    contractAddress: address,
    signer: ethers.Wallet,
  ) {
    super(provider, contractAddress, ammABI, signer);
  }

  public async getUnderlyingPrice() {
    return await this.contract.getUnderlyingPrice();
  }

  public async setPriceFeed(priceFeed: address) {
    return await (
      await this.contract
        .connect(this.signer)
        .setPriceFeed(priceFeed, { gasLimit: 1000000 })
    ).wait();
  }
}
