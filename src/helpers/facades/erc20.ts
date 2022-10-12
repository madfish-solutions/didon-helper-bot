import { ethers, Transaction } from "ethers";
import { address, EthersProvider } from "../types";
import { BigNumber } from "bignumber.js";
import { CommonFacade } from "./common";
import erc20ABI from "../../abis/erc20.json";

export class ERC20 extends CommonFacade {
  constructor(
    provider: EthersProvider,
    contractAddress: address,
    signer: ethers.Wallet,
  ) {
    super(provider, contractAddress, erc20ABI, signer);
  }

  /**
   * @notice add new minter
   */
  public async addMinter(minter: address, signer: any): Promise<Transaction> {
    const minterRoleBytes = await this.contract.MINTER_ROLE();
    await this.contract
      .connect(signer)
      .estimateGas.grantRole(minterRoleBytes, minter);
    return await (
      await this.contract.connect(signer).grantRole(minterRoleBytes, minter)
    ).wait();
  }

  public async removeMinter(minter: address, signer: any) {
    const minterRoleBytes = await this.contract.MINTER_ROLE();
    await this.contract
      .connect(signer)
      .estimateGas.revokeRole(minterRoleBytes, minter);
    return await (
      await this.contract.connect(signer).revokeRole(minterRoleBytes, minter)
    ).wait();
  }

  public async increaseAllowance(spender: address, amount: BigNumber) {
    await this.contract
      .connect(this.signer)
      .estimateGas.approve(spender, amount.toFixed(), { gasLimit: 1000000 });

    return await (
      await this.contract
        .connect(this.signer)
        .approve(spender, amount.toFixed(), { gasLimit: 1000000 })
    ).wait();
  }

  public async decreaseAllowance(spender: address) {
    await this.contract
      .connect(this.signer)
      .estimateGas.approve(spender, 0, { gasLimit: 1000000 });
    return await (
      await this.contract
        .connect(this.signer)
        .approve(spender, 0, { gasLimit: 1000000 })
    ).wait();
  }

  public async mint(to: address, amount: BigNumber) {
    await this.contract
      .connect(this.signer)
      .estimateGas.mint(to, amount.toFixed(), { gasLimit: 1000000 });
    return await (
      await this.contract
        .connect(this.signer)
        .mint(to, amount.toFixed(), { gasLimit: 1000000 })
    ).wait();
  }

  public async getBalance(account: address) {
    return await this.contract.balanceOf(account);
  }
}
