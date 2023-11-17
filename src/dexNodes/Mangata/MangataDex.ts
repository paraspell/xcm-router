import { type Extrinsic, InvalidCurrencyError, getAssetId } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { BN } from '@polkadot/util';
import { type TSwapOptions } from '../../types';
import { getMinAmountOut } from './utils';
import { type ApiPromise } from '@polkadot/api';

class MangataExchangeNode extends ExchangeNode {
  constructor() {
    super('Mangata');
  }

  async swapCurrency(
    api: ApiPromise,
    { currencyFrom, currencyTo, amount, slippagePct }: TSwapOptions,
  ): Promise<Extrinsic> {
    console.log('Swapping currency on Mangata');

    const currencyFromId = getAssetId(this.node, currencyFrom);
    const currencyToId = getAssetId(this.node, currencyTo);

    if (currencyFromId === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (currencyToId === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const minAmountOut = getMinAmountOut(new BN(amount), slippagePct);
    return api.tx.xyk.multiswapSellAsset([currencyFromId, currencyToId], amount, minAmountOut);
  }
}

export default MangataExchangeNode;
