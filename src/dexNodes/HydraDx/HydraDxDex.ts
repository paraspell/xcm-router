import { type Extrinsic, InvalidCurrencyError, getAssetDecimals } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { PoolService, TradeRouter, BigNumber, PoolType } from '@galacticcouncil/sdk';
import { calculateFee, getAssetInfo, getMinAmountOut } from './utils';
import { type TSwapResult, type TSwapOptions } from '../../types';
import { type ApiPromise } from '@polkadot/api';

class HydraDxExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    const { currencyFrom, currencyTo, slippagePct, amount } = options;
    console.log(`Swapping currency on ${this.node}...`);

    const poolService = new PoolService(api);
    const tradeRouter = new TradeRouter(
      poolService,
      this.node === 'Basilisk' ? { includeOnly: [PoolType.XYK] } : undefined,
    );
    const currencyFromInfo = await getAssetInfo(tradeRouter, currencyFrom);
    const currencyToInfo = await getAssetInfo(tradeRouter, currencyTo);

    const currencyFromDecimals = getAssetDecimals(this.node, currencyFrom);
    const currencyToDecimals = getAssetDecimals(this.node, currencyTo);

    if (currencyFromDecimals === null || currencyToDecimals === null) {
      throw new InvalidCurrencyError('Decimals not found for currency from');
    }

    if (currencyFromInfo === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (currencyToInfo === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const amountBnum = BigNumber(amount);
    const tradeFee = await calculateFee(
      options,
      tradeRouter,
      currencyFromInfo,
      currencyToInfo,
      currencyFromDecimals,
      currencyFromDecimals,
      this.node,
      toDestTransactionFee,
    );
    const amountWithoutFee = amountBnum.minus(tradeFee);
    const amountNormalized = amountWithoutFee.shiftedBy(-currencyFromDecimals);

    console.log('Original amount', amount);
    console.log('Amount modified', amountWithoutFee.toString());

    const trade = await tradeRouter.getBestSell(
      currencyFromInfo.id,
      currencyToInfo.id,
      amountNormalized,
    );
    const minAmountOut = getMinAmountOut(trade.amountOut, currencyFromDecimals, slippagePct);
    const tx: Extrinsic = await trade.toTx(minAmountOut.amount).get();

    return { tx, amountOut: trade.amountOut.toString() };
  }
}

export default HydraDxExchangeNode;
