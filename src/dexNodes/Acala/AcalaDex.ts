import { type Extrinsic } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { AcalaDex, AggregateDex } from '@acala-network/sdk-swap';
import { Wallet } from '@acala-network/sdk';
import { type TSwapResult, type TSwapOptions } from '../../types';
import { firstValueFrom } from 'rxjs';
import { type ApiPromise } from '@polkadot/api';
import { calculateAcalaTransactionFee, createAcalaApiInstance } from './utils';
import BigNumber from 'bignumber.js';
import { FEE_BUFFER } from '../../consts';

class AcalaExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
    toExchangeTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    console.log(`Swapping currency on ${this.node}...`);

    const { currencyFrom, currencyTo, amount } = options;

    const wallet = new Wallet(api as any);
    await wallet.isReady;

    const fromToken = wallet.getToken(currencyFrom);
    const toToken = wallet.getToken(currencyTo);

    const acalaDex = new AcalaDex({ api, wallet });

    const dex = new AggregateDex({
      api,
      wallet,
      providers: [acalaDex],
    });

    const amountBN = new BigNumber(amount);

    const feeInCurrencyFromBN = await calculateAcalaTransactionFee(
      dex,
      wallet,
      fromToken,
      toToken,
      options,
      toDestTransactionFee,
    );

    console.log(
      'XCM to exch. fee:',
      toExchangeTransactionFee.shiftedBy(-fromToken.decimals).toString(),
      fromToken.symbol,
    );

    const toExchangeFeeWithBuffer = toExchangeTransactionFee.multipliedBy(FEE_BUFFER);

    console.log(
      'XCM to exch. fee /w buffer:',
      toExchangeFeeWithBuffer.shiftedBy(-fromToken.decimals).toString(),
      fromToken.symbol,
    );

    const amountWithoutFee = amountBN.minus(feeInCurrencyFromBN).minus(toExchangeFeeWithBuffer);

    console.log('Original amount', amount);
    console.log('Amount modified', amountWithoutFee.toString());

    const tradeResult = await firstValueFrom(
      dex.swap({
        path: [fromToken, toToken],
        source: 'aggregate',
        mode: 'EXACT_INPUT',
        input: new FixedPointNumber(
          amountWithoutFee.shiftedBy(-fromToken.decimals).toString(),
          fromToken.decimals,
        ),
      }),
    );

    const tx = dex.getTradingTx(tradeResult) as unknown as Extrinsic;

    const amountOut = tradeResult.result.output.amount.toString();
    const amountOutBN = new BigNumber(amountOut).shiftedBy(toToken.decimals);

    console.log('Calculated amount out:', amountOutBN.toString());
    console.log('Amount out decimals', toToken.decimals);

    const nativeCurrency = wallet.consts.nativeCurrency;
    const nativeCurrencyDecimals = wallet.getToken(nativeCurrency).decimals;

    const convertedFeeNativeCurrency = toDestTransactionFee
      .shiftedBy(-nativeCurrencyDecimals)
      .toNumber();

    const nativeCurrencyUsdPrice = (await wallet.getPrice(nativeCurrency)).toNumber();
    const currencyToUsdPrice = (await wallet.getPrice(toToken.symbol)).toNumber();

    if (currencyToUsdPrice === 0) {
      throw new Error(`Could not fetch price for ${toToken.symbol}`);
    }

    const feeInUsd = convertedFeeNativeCurrency * nativeCurrencyUsdPrice;

    const feeInCurrencyTo = (feeInUsd / currencyToUsdPrice) * FEE_BUFFER;

    console.log('Amount out fee', feeInCurrencyTo.toString(), nativeCurrency);

    const currencyToFeeBnum = new BigNumber(feeInCurrencyTo).shiftedBy(toToken.decimals);
    const amountOutModified = amountOutBN.minus(currencyToFeeBnum).decimalPlaces(0);

    console.log('Amount out original', amountOut.toString());
    console.log('Amount out modified', amountOutModified.toString());

    return { tx, amountOut: amountOutModified.toString() };
  }

  async createApiInstance(): Promise<ApiPromise> {
    return await createAcalaApiInstance(this.node);
  }
}

export default AcalaExchangeNode;
