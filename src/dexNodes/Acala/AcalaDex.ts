import { type Extrinsic } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { AcalaDex, AggregateDex } from '@acala-network/sdk-swap';
import { Wallet } from '@acala-network/sdk';
import { type TSwapOptions } from '../../types';
import { firstValueFrom } from 'rxjs';
import { type ApiPromise } from '@polkadot/api';
import { createAcalaApiInstance } from './utils';

class AcalaExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    { currencyFrom, currencyTo, amount }: TSwapOptions,
  ): Promise<Extrinsic> {
    console.log('Swapping currency on Acala');

    const wallet = new Wallet(api as any);
    await wallet.isReady;

    const fromToken = wallet.getToken(currencyFrom);
    const toToken = wallet.getToken(currencyTo);

    const dex = new AggregateDex({
      api,
      wallet,
      providers: [new AcalaDex({ api, wallet })],
    });

    const fee = api.consts.dex.getExchangeFee;
    console.log(fee.toHuman());

    // const amountBnum = new BigNumber(amount)
    //   .div(new BigNumber(10).pow(fromToken.decimals))
    //   .toFixed();

    // console.log(amountBnum);

    const result = await firstValueFrom(
      dex.swap({
        path: [fromToken, toToken],
        source: 'aggregate',
        mode: 'EXACT_INPUT',
        input: new FixedPointNumber(amount, fromToken.decimals),
      }),
    );

    // console.log(result.result.exchangeFee.toString());

    return dex.getTradingTx(result) as unknown as Extrinsic;
  }

  async createApiInstance(): Promise<ApiPromise> {
    return await createAcalaApiInstance();
  }
}

export default AcalaExchangeNode;
