import { getNodeProvider, getAssetId, type TNode } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { type TSwapResult, type TSwapOptions } from '../../types';
import {
  createInterBtcApi,
  getAllTradingPairs,
  newMonetaryAmount,
  type CurrencyExt,
  type InterBtcApi,
} from '@interlay/interbtc-api';
import { type ApiPromise } from '@polkadot/api';

const getCurrency = async (
  symbol: string,
  interBTC: InterBtcApi,
  node: TNode,
): Promise<CurrencyExt | null> => {
  if (symbol === 'DOT') {
    return interBTC.getGovernanceCurrency();
  } else if (symbol === 'INTR') {
    return interBTC.getRelayChainCurrency();
  } else if (symbol === 'IBTC') {
    return interBTC.getWrappedCurrency();
  } else {
    const id = getAssetId(node, symbol);
    if (id === null) return null;
    return await interBTC.assetRegistry.getForeignAsset(Number(id));
  }
};

class InterlayExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    { injectorAddress, currencyFrom, currencyTo, amount, slippagePct }: TSwapOptions,
  ): Promise<TSwapResult> {
    console.log('Swapping currency on Interlay');

    const interBTC = await createInterBtcApi(getNodeProvider(this.node) as any, 'mainnet');

    const assetFrom = await getCurrency(currencyFrom, interBTC, this.node);

    if (assetFrom === null) {
      throw new Error('Currency from is invalid.');
    }

    const assetTo = await getCurrency(currencyFrom, interBTC, this.node);

    if (assetTo === null) {
      throw new Error('Currency to is invalid.');
    }

    const inputAmount = newMonetaryAmount(amount, assetFrom);

    const liquidityPools = await interBTC.amm.getLiquidityPools();

    const trade = interBTC.amm.getOptimalTrade(inputAmount, assetTo, liquidityPools);

    if (trade === null) {
      throw new Error('No trade found');
    }

    const outputAmount = trade.getMinimumOutputAmount(Number(slippagePct));

    const deadline = 999999;

    const trade1 = interBTC.amm.swap(trade, outputAmount, injectorAddress, deadline);
    return trade1.extrinsic as any;
  }
}

export default InterlayExchangeNode;
