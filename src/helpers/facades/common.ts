import { BigNumber } from 'bignumber.js';
import { Contract, ethers } from 'ethers';

import { address, EthersProvider, EthersSigner } from '../types';

export class CommonFacade {
  static address: address;
  provider: EthersProvider;
  contract: Contract;
  signer: EthersSigner;
  public static PRECISION = 1e18;

  constructor(
    provider: EthersProvider | string,
    contractAddress: address,
    abi: ethers.ContractInterface,
    signer: ethers.Wallet | ethers.providers.JsonRpcSigner,
  ) {
    this.provider = typeof provider === 'string' ? new ethers.providers.JsonRpcProvider(provider) : provider;
    this.contract = new ethers.Contract(contractAddress, abi, this.provider);
    this.signer = signer;
  }

  public async getOwner(): Promise<address> {
    return await this.contract.methods.owner().call();
  }

  public fromPrecision(value: BigNumber, precision = CommonFacade.PRECISION): BigNumber {
    return value.div(precision);
  }

  public toPrecision(value: BigNumber, precision = CommonFacade.PRECISION): BigNumber {
    return value.multipliedBy(precision);
  }
}
