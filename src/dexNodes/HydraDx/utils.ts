import { BigNumber, type TradeRouter, bnum } from '@galacticcouncil/sdk';
import { type TSwapOptions } from '../../types';

export const calculateFee = async (
  { amount, slippagePct, injectorAddress }: TSwapOptions,
  tradeRouter: TradeRouter,
  currencyFromId: string,
  currencyToId: string,
): Promise<BigNumber> => {
  const amountBnum = BigNumber(amount);

  const trade: any = await tradeRouter.getBestSell(
    currencyFromId,
    currencyToId,
    amountBnum.toString(),
  );
  const minAmountOut = getMinAmountOut(trade.amountOut, 18, slippagePct);

  const price = await tradeRouter.getBestSpotPrice('0', currencyFromId);

  if (price === undefined) {
    throw new Error('Price not found');
  }

  const partialFee = (
    await trade.toTx(minAmountOut.amount).get().paymentInfo(injectorAddress)
  ).partialFee.toNumber();

  const feeHdx = BigNumber(partialFee).dividedBy(Math.pow(10, 12));

  const astrPrice = price.amount;
  const astrPrice12dec = astrPrice.dividedBy(Math.pow(10, 18));
  const astrFee = feeHdx.multipliedBy(astrPrice12dec);
  const finalFee = astrFee.multipliedBy(1.5);
  return finalFee.multipliedBy(BigNumber(10).pow(18));
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

export const findCurrencyId = async (
  tradeRouter: any,
  currencySymbol: string,
): Promise<string | undefined> => {
  const assetPairs = await tradeRouter.getAllAssets();
  return assetPairs.find((assetPair: any) => assetPair.symbol === currencySymbol)?.id;
};
