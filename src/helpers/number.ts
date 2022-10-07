import BigNumber from 'bignumber.js';
import { BigNumber as EthersBigNumber } from 'ethers';

export const DEFAULT_TOKEN_DECIMALS = 18;
export const ONE_DAY = 60 * 60 * 24;

export type MixedDecimal = number | string;

export interface Decimal {
  d: MixedDecimal;
}

export function toBigNumber(value: number | string | EthersBigNumber | [number | EthersBigNumber]): BigNumber {
  if (value instanceof Array) {
    return toBigNumber(value[0]);
  }

  if (value instanceof BigNumber) {
    return value;
  }

  return new BigNumber(value.toString());
}
