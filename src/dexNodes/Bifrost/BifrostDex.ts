import ExchangeNode from '../DexNode';
import { type TSwapResult, type TSwapOptions } from '../../types';
import { type ApiPromise } from '@polkadot/api';
import { getParaId } from '@paraspell/sdk';
import { PairState, fetchPairs } from './utils';
import { Amount, DOT, WNATIVE, getCurrencyCombinations } from '@crypto-dex-sdk/currency';
import { Trade, type Pair } from '@crypto-dex-sdk/amm';
import { SwapRouter } from '@crypto-dex-sdk/parachains-bifrost';
import { Percent } from '@crypto-dex-sdk/math';

class BifrostExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    { currencyFrom, currencyTo, amount, injectorAddress, slippagePct }: TSwapOptions,
  ): Promise<TSwapResult> {
    console.log('Swapping currency on Bifrost');

    const chainId = getParaId(this.node);

    console.log('chain id', chainId);

    const token0 = WNATIVE[chainId];
    const token1 = DOT[chainId];

    console.log(token0);
    console.log(token1);

    const currencyCombinations = getCurrencyCombinations(chainId, token0, token1);

    // console.log('currency combinations', currencyCombinations);

    const pairs = await fetchPairs(api, chainId, currencyCombinations);

    // console.log('pairs', pairs);

    const amountIn = Amount.fromRawAmount(token0, 1000000000000);

    const filteredPairs = Object.values(
      pairs.data
        .filter((result): result is [PairState.EXISTS, Pair] =>
          Boolean(result[0] === PairState.EXISTS && result[1]),
        )
        .map(([, pair]) => pair),
    );

    const trades = Trade.bestTradeExactIn(chainId, filteredPairs, [], amountIn, token1);

    if (trades.length < 1) {
      throw new Error('Trade not found');
    }

    const trade = trades[0];

    const allowedSlippage = new Percent(Number(slippagePct) * 100, 10_000);

    const blockNumber = await api.derive.chain.bestNumber();

    const deadline = blockNumber.toNumber() + 20;

    const { extrinsic } = SwapRouter.swapCallParameters(trade, {
      api,
      allowedSlippage,
      recipient: injectorAddress,
      deadline,
    });

    if (extrinsic === null) {
      throw new Error('Extrinsic is null');
    }

    console.log(trade);

    return {
      tx: extrinsic[0],
      amountOut: '0',
    };
  }
}

export default BifrostExchangeNode;
