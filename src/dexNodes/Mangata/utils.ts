import { type TokenInfo, type MangataInstance } from '@mangata-finance/sdk';
import { BN } from '@polkadot/util';

export const PCT_100 = new BN('100');

export const calculateSlippage = (amount: BN, slippagePct: string): any => {
  const slippage = amount.div(PCT_100).mul(new BN(slippagePct));
  return slippage;
};

export const getMinAmountOut = (amountOut: BN, slippagePct: string): BN => {
  const slippage = calculateSlippage(amountOut, slippagePct);
  const minAmountOut = amountOut.sub(slippage);
  return minAmountOut;
};

export const getAssetInfo = async (
  mangata: MangataInstance,
  symbol: string,
): Promise<TokenInfo | undefined> => {
  return await mangata.query
    .getAssetsInfo()
    .then((assets) => Object.values(assets).find((asset) => asset.symbol === symbol));
};
