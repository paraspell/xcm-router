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

class AcalaExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    console.log('Swapping currency on Acala');

    console.log('xcm fee', toDestTransactionFee.toString());

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

    console.log('feeInCurrencyFromBN', feeInCurrencyFromBN.toString());

    const amountWithoutFee = amountBN.minus(feeInCurrencyFromBN);

    console.log('amountWithoutFee', amountWithoutFee.toString());

    const tradeResult = await firstValueFrom(
      dex.swap({
        path: [fromToken, toToken],
        source: 'aggregate',
        mode: 'EXACT_INPUT',
        input: new FixedPointNumber(
          amountWithoutFee.shiftedBy(-fromToken.decimals).toNumber(),
          fromToken.decimals,
        ),
      }),
    );

    const tx = dex.getTradingTx(tradeResult) as unknown as Extrinsic;

    const amountOut = tradeResult.result.output.amount.toString();
    const amountOutBN = new BigNumber(amountOut).shiftedBy(toToken.decimals);

    console.log(amountOutBN.toString());
    console.log(toToken.decimals);

    return { tx, amountOut: amountOutBN.toString() };
  }

  async createApiInstance(): Promise<ApiPromise> {
    return await createAcalaApiInstance(this.node);
  }
}

export default AcalaExchangeNode;
