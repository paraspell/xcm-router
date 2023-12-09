import { InvalidCurrencyError } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { BN } from '@polkadot/util';
import { type TSwapResult, type TSwapOptions } from '../../types';
import { getAssetInfo } from './utils';
import { type ApiPromise } from '@polkadot/api';
import {
  BN_HUNDRED,
  Mangata,
  type MangataInstance,
  type MultiswapSellAsset,
} from '@mangata-finance/sdk';
import { FEE_BUFFER } from '../../consts/consts';
import { getAllPools, routeExactIn } from './routingUtils';

class MangataExchangeNode extends ExchangeNode {
  constructor() {
    super('Mangata');
  }

  private static readonly FIXED_FEE = 0.03 * FEE_BUFFER;

  async swapCurrency(api: ApiPromise, options: TSwapOptions): Promise<TSwapResult> {
    console.log('Swapping currency on Mangata');

    const { currencyFrom, currencyTo, amount, injectorAddress } = options;

    const mangata: MangataInstance = Mangata.instance(['wss://kusama-archive.mangata.online']);

    const assetFromInfo = await getAssetInfo(mangata, currencyFrom);
    const assetToInfo = await getAssetInfo(mangata, currencyTo);

    if (assetFromInfo === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (assetToInfo === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const allPools = await getAllPools(mangata);
    const res = routeExactIn(allPools, assetFromInfo, assetToInfo, new BN(amount), true);

    if (res.bestRoute === null || res.bestAmount === null) {
      throw new Error('Swap route is null');
    }

    const MAX_SLIPPAGE = 1;

    const minAmountOutBN = res.bestAmount.mul(new BN(100 - MAX_SLIPPAGE)).div(BN_HUNDRED);

    console.log('Original amount', amount);
    console.log('Best amount', res.bestAmount.toString());
    console.log('Min Amount out', minAmountOutBN.toString());

    const args: MultiswapSellAsset = {
      account: injectorAddress,
      tokenIds: res.bestRoute.map((item) => item.id),
      amount: new BN(amount),
      minAmountOut: minAmountOutBN,
    };
    const tx = await mangata.submitableExtrinsic.multiswapSellAsset(args);

    return {
      tx,
      amountOut: res.bestAmount.toString(),
    };
  }
}

export default MangataExchangeNode;
