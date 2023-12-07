import { ApiPromise, WsProvider } from '@polkadot/api';
import { options } from '@acala-network/api';
import { type Extrinsic, getNodeProvider, type TNode } from '@paraspell/sdk';
import BigNumber from 'bignumber.js';
import { type Wallet } from '@acala-network/sdk';
import { type TSwapOptions } from '../../types';
import { type AggregateDex } from '@acala-network/sdk-swap';
import { FixedPointNumber, type Token } from '@acala-network/sdk-core';
import { firstValueFrom } from 'rxjs';
import { FEE_BUFFER } from '../../consts/consts';
import { calculateTransactionFee } from '../../utils';

export const createAcalaApiInstance = async (node: TNode): Promise<ApiPromise> => {
  const provider = new WsProvider(getNodeProvider(node) as any, 100);
  const api = new ApiPromise(
    options({
      provider,
    }),
  );
  await api.isReady;
  return api;
};

export const calculateAcalaTransactionFee = async (
  dex: AggregateDex,
  wallet: Wallet,
  tokenFrom: Token,
  tokenTo: Token,
  { amount, injectorAddress }: TSwapOptions,
  toDestTransactionFee: BigNumber,
): Promise<BigNumber> => {
  const normalNumberAmount = new BigNumber(amount).shiftedBy(-tokenFrom.decimals).toNumber();

  const feeCalculationResult = await firstValueFrom(
    dex.swap({
      path: [tokenFrom, tokenTo],
      source: 'aggregate',
      mode: 'EXACT_INPUT',
      input: new FixedPointNumber(normalNumberAmount, tokenFrom.decimals),
    }),
  );

  const txForFeeCalculation = dex.getTradingTx(feeCalculationResult) as unknown as Extrinsic;

  const swapFee = await calculateTransactionFee(txForFeeCalculation, injectorAddress);
  const swapFeeNativeCurrency = new BigNumber(swapFee.toNumber());

  const feeInNativeCurrency = swapFeeNativeCurrency
    .plus(toDestTransactionFee)
    .plus(toDestTransactionFee);
  const nativeCurrency = wallet.consts.nativeCurrency;

  console.log('XCM to exch. fee:', swapFeeNativeCurrency.toString(), nativeCurrency);
  console.log('XCM to dest. fee:', swapFeeNativeCurrency.toString(), nativeCurrency);
  console.log('Swap fee:', swapFee.toString());

  if (tokenFrom.symbol === nativeCurrency) return feeInNativeCurrency;

  const nativeCurrencyDecimals = wallet.getToken(nativeCurrency).decimals;

  const convertedFeeNativeCurrency = feeInNativeCurrency
    .shiftedBy(-nativeCurrencyDecimals)
    .toNumber();

  const nativeCurrencyUsdPrice = (await wallet.getPrice(nativeCurrency)).toNumber();
  const currencyFromUsdPrice = (await wallet.getPrice(tokenFrom.symbol)).toNumber();

  const feeInUsd = convertedFeeNativeCurrency * nativeCurrencyUsdPrice;

  const feeInCurrencyFrom = (feeInUsd / currencyFromUsdPrice) * FEE_BUFFER;

  const feeInCurrencyFromBN = new BigNumber(feeInCurrencyFrom).shiftedBy(tokenFrom.decimals);

  return feeInCurrencyFromBN;
};
