import {
  type TokenInfo,
  type MangataInstance,
  type MultiswapSellAsset,
} from '@mangata-finance/sdk';
import { BN, BN_ONE } from '@polkadot/util';
import { type TSwapOptions } from '../../types';
import BigNumber from 'bignumber.js';
import { FEE_BUFFER } from '../../consts/consts';

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

export const calculateMangataTransactionFee = async (
  mangata: MangataInstance,
  tokenFrom: TokenInfo,
  tokenTo: TokenInfo,
  { amount, injectorAddress, slippagePct }: TSwapOptions,
): Promise<BigNumber> => {
  const minAmountOut = getMinAmountOut(new BN(amount), slippagePct);

  const args: MultiswapSellAsset = {
    account: injectorAddress,
    tokenIds: [tokenFrom.id, tokenTo.id],
    amount: new BN(amount),
    minAmountOut,
  };
  const txForFeeCalculation = await mangata.submitableExtrinsic.multiswapSellAsset(args);

  const { partialFee } = await txForFeeCalculation.paymentInfo(injectorAddress);
  const feeInNativeCurrency = new BigNumber(partialFee.toNumber());
  const nativeCurrency = await mangata.query.getTokenInfo('MGX');

  if (tokenFrom.symbol === nativeCurrency.symbol) return feeInNativeCurrency;

  const convertedFeeNativeCurrency = feeInNativeCurrency
    .shiftedBy(-nativeCurrency.decimals)
    .toNumber();

  const nativeCurrencyUsdPrice = (
    await mangata.rpc.calculateBuyPriceId(tokenFrom.id, tokenTo.id, BN_ONE)
  ).toNumber();
  const currencyFromUsdPrice = (
    await mangata.rpc.calculateBuyPriceId(tokenFrom.id, tokenTo.id, BN_ONE)
  ).toNumber();

  const feeInUsd = convertedFeeNativeCurrency * nativeCurrencyUsdPrice;

  const feeInCurrencyFrom = (feeInUsd / currencyFromUsdPrice) * FEE_BUFFER;

  const feeInCurrencyFromBN = new BigNumber(feeInCurrencyFrom).shiftedBy(tokenFrom.decimals);

  return feeInCurrencyFromBN;
};
