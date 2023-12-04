import { type Extrinsic, InvalidCurrencyError, getAssetDecimals } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { PoolService, TradeRouter, BigNumber, PoolType } from '@galacticcouncil/sdk';
import { calculateFee, findCurrencyId, getMinAmountOut } from './utils';
import { type TSwapResult, type TSwapOptions } from '../../types';
import { type ApiPromise } from '@polkadot/api';

class HydraDxExchangeNode extends ExchangeNode {
  async swapCurrency(api: ApiPromise, options: TSwapOptions): Promise<TSwapResult> {
    const { currencyFrom, currencyTo, slippagePct, amount } = options;
    console.log('Swapping currency on HydraDX');

    const poolService = new PoolService(api);
    const tradeRouter = new TradeRouter(
      poolService,
      this.node === 'Basilisk' ? { includeOnly: [PoolType.XYK] } : undefined,
    );
    const currencyFromId = await findCurrencyId(tradeRouter, currencyFrom);
    const currencyToId = await findCurrencyId(tradeRouter, currencyTo);

    const currencyFromDecimals = getAssetDecimals(this.node, currencyFrom);
    // const currencyToDecimals = getAssetDecimals(this.node, currencyTo);

    if (currencyFromDecimals === null || currencyFromDecimals === undefined) {
      throw new InvalidCurrencyError('Decimals not found for currency from');
    }

    if (currencyFromId === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (currencyToId === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const amountBnum = BigNumber(amount);
    const tradeFee = await calculateFee(options, tradeRouter, currencyFromId, currencyToId);
    const amountWithFee = amountBnum.minus(tradeFee);
    const amountNormalized = amountWithFee.div(BigNumber(10).pow(currencyFromDecimals));
    const trade = await tradeRouter.getBestSell(currencyFromId, currencyToId, amountNormalized);
    const minAmountOut = getMinAmountOut(trade.amountOut, currencyFromDecimals, slippagePct);
    const tx: Extrinsic = await trade.toTx(minAmountOut.amount).get();

    return { tx, amountOut: trade.amountOut.toString() };
  }
}

export default HydraDxExchangeNode;
