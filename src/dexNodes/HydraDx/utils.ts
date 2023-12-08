import { BigNumber, type TradeRouter, bnum, type PoolAsset } from '@galacticcouncil/sdk';
import { type TSwapOptions } from '../../types';
import { type TNode, type Extrinsic, getAssetDecimals } from '@paraspell/sdk';
import { FEE_BUFFER } from '../../consts/consts';
import { calculateTransactionFee } from '../../utils';

export const calculateFee = async (
  { amount, slippagePct, injectorAddress }: TSwapOptions,
  tradeRouter: TradeRouter,
  currencyFromInfo: PoolAsset,
  currencyToInfo: PoolAsset,
  currencyFromDecimals: number,
  currencyToDecimals: number,
  node: TNode,
  toDestTransactionFee: BigNumber,
): Promise<BigNumber> => {
  const amountBnum = BigNumber(amount);

  const trade = await tradeRouter.getBestSell(
    currencyFromInfo.id,
    currencyToInfo.id,
    amountBnum.toString(),
  );
  const minAmountOut = getMinAmountOut(trade.amountOut, currencyToDecimals, slippagePct);

  const nativeCurrencyInfo = await getAssetInfo(tradeRouter, node === 'HydraDX' ? 'HDX' : 'BSX');

  if (nativeCurrencyInfo === undefined) {
    throw new Error('Native currency not found');
  }

  const nativeCurrencyDecimals = getAssetDecimals(node, nativeCurrencyInfo.symbol);

  if (nativeCurrencyDecimals === null) {
    throw new Error('Native currency decimals not found');
  }

  const currencyFromPriceInfo = await tradeRouter.getBestSpotPrice(
    currencyFromInfo.id,
    nativeCurrencyInfo.id,
  );

  if (currencyFromPriceInfo === undefined) {
    throw new Error('Price not found');
  }

  const tx: Extrinsic = trade.toTx(minAmountOut.amount).get();
  const swapFee = await calculateTransactionFee(tx, injectorAddress);
  const swapFeeNativeCurrency = new BigNumber(swapFee.toString());
  const feeInNativeCurrency = swapFeeNativeCurrency
    .plus(toDestTransactionFee)
    .plus(toDestTransactionFee);

  console.log('XCM to exch. fee:', toDestTransactionFee.toString(), nativeCurrencyInfo.symbol);
  console.log('XCM to dest. fee:', toDestTransactionFee.toString(), nativeCurrencyInfo.symbol);
  console.log('Swap fee:', swapFee.toString(), nativeCurrencyInfo.symbol);
  console.log('Total fee:', feeInNativeCurrency.toString(), nativeCurrencyInfo.symbol);

  if (currencyFromInfo.symbol === nativeCurrencyInfo.symbol) return feeInNativeCurrency;

  const feeNativeCurrencyNormalNumber = feeInNativeCurrency.shiftedBy(-nativeCurrencyDecimals);

  const currencyFromPrice = currencyFromPriceInfo.amount;
  const currencyFromPriceNormalNumber = currencyFromPrice.shiftedBy(
    -currencyFromPriceInfo.decimals,
  );

  const currencyFromFee = feeNativeCurrencyNormalNumber.dividedBy(currencyFromPriceNormalNumber);

  console.log(
    'Total fee in currency from:',
    currencyFromFee.toString(),
    ' ',
    currencyFromInfo.symbol,
  );

  const finalFee = currencyFromFee.multipliedBy(FEE_BUFFER);

  console.log(
    'Total fee in currency from with buffer 50%:',
    finalFee.toString(),
    ' ',
    currencyFromInfo.symbol,
  );

  return finalFee.shiftedBy(currencyFromDecimals);
};

export const PCT_100 = bnum('100');

export const calculateSlippage = (amount: BigNumber, slippagePct: string): any => {
  const slippage = amount.div(PCT_100).multipliedBy(slippagePct);
  return slippage.decimalPlaces(0, 1);
};

export const getMinAmountOut = (
  amountOut: BigNumber,
  assetOutDecimals: number,
  slippagePct: string,
): { amount: BigNumber; decimals: number } => {
  const slippage = calculateSlippage(amountOut, slippagePct);
  const minAmountOut = amountOut.minus(slippage);

  return {
    amount: minAmountOut,
    decimals: assetOutDecimals,
  };
};

export const getAssetInfo = async (
  tradeRouter: TradeRouter,
  currencySymbol: string,
): Promise<PoolAsset | undefined> => {
  const assets = await tradeRouter.getAllAssets();
  return assets.find((asset: any) => asset.symbol === currencySymbol);
};
