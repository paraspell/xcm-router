import { type TokenInfo, type MangataInstance } from '@mangata-finance/sdk';
import BigNumber from 'bignumber.js';

export const PCT_100 = new BigNumber('100');

export const calculateSlippage = (amount: BigNumber, slippagePct: string): any => {
  const slippage = amount.div(PCT_100).multipliedBy(slippagePct);
  return slippage.decimalPlaces(0, 1);
};

export const getMinAmountOut = (amountOut: BigNumber, slippagePct: string): BigNumber => {
  const slippage = calculateSlippage(amountOut, slippagePct);
  return amountOut.minus(slippage);
};

export const getAssetInfo = async (
  mangata: MangataInstance,
  symbol: string,
): Promise<TokenInfo | undefined> => {
  return await mangata.query
    .getAssetsInfo()
    .then((assets) => Object.values(assets).find((asset) => asset.symbol === symbol));
};
