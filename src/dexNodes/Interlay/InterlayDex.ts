import { getNodeProvider, type Extrinsic, getAssetId } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { type TSwapOptions } from '../../types';
import { createInterBtcApi, getAllTradingPairs, newMonetaryAmount } from '@interlay/interbtc-api';
import { type ApiPromise } from '@polkadot/api';

class InterlayExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    { injectorAddress, currencyFrom, currencyTo, amount, slippagePct }: TSwapOptions,
  ): Promise<Extrinsic> {
    console.log('Swapping currency on Interlay');

    const interBTC = await createInterBtcApi(getNodeProvider(this.node), 'mainnet');

    let currency0;
    if (currencyFrom === 'DOT') {
      currency0 = interBTC.getGovernanceCurrency();
    } else {
      const currencyFromId = Number(getAssetId(this.node, currencyFrom));
      currency0 = await interBTC.assetRegistry.getForeignAsset(currencyFromId);
    }

    let currency1;
    if (currencyTo === 'IBTC') {
      currency1 = interBTC.getRelayChainCurrency();
    } else {
      const currencyToId = Number(getAssetId(this.node, currencyTo));
      currency1 = await interBTC.assetRegistry.getForeignAsset(currencyToId);
    }

    const inputAmount = newMonetaryAmount(1, currency0);

    const liquidityPools = await interBTC.amm.getLiquidityPools();

    const pairs = getAllTradingPairs(liquidityPools);

    console.log(pairs);

    const trade = interBTC.amm.getOptimalTrade(inputAmount, currency1, liquidityPools);

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
