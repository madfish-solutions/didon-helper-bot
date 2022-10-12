import { ethers } from "ethers";
import { address, EthersProvider } from "../types";
import { BigNumber } from "bignumber.js";
import { CommonFacade } from "./common";
import clearingViewerABI from "../../abis/clearingViewer.json";

export class ClearingHouseViewer extends CommonFacade {
  constructor(
    provider: EthersProvider,
    contractAddress: address,
    signer: ethers.Wallet,
  ) {
    super(provider, contractAddress, clearingViewerABI, signer);
  }

  public async getPersonalBalanceWithFundingPayment(
    quouteToken: string,
    trader: address,
  ): Promise<BigNumber> {
    return await this.contract.getPersonalBalanceWithFundingPayment(
      quouteToken,
      trader,
    );
  }
}
