import { InvalidCurrencyError } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { BN } from '@polkadot/util';
import { type TSwapResult, type TSwapOptions } from '../../types';
import { getMinAmountOut } from './utils';
import { type ApiPromise } from '@polkadot/api';
import {
  Mangata,
  type TokenInfo,
  type MangataInstance,
  type MultiswapSellAsset,
} from '@mangata-finance/sdk';

class MangataExchangeNode extends ExchangeNode {
  constructor() {
    super('Mangata');
  }

  async swapCurrency(
    api: ApiPromise,
    { currencyFrom, currencyTo, amount, slippagePct, injectorAddress }: TSwapOptions,
  ): Promise<TSwapResult> {
    console.log('Swapping currency on Mangata');

    const mangata: MangataInstance = Mangata.instance(['wss://kusama-archive.mangata.online']);

    const assetFromInfo: TokenInfo = await mangata.query.getTokenInfo(currencyFrom);
    const assetToInfo: TokenInfo = await mangata.query.getTokenInfo(currencyTo);

    if (assetFromInfo === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (assetToInfo === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const minAmountOut = getMinAmountOut(new BN(amount), slippagePct);

    const args: MultiswapSellAsset = {
      account: injectorAddress,
      tokenIds: [assetFromInfo.id, assetToInfo.id],
      amount: new BN(amount),
      minAmountOut,
    };
    const tx = await mangata.submitableExtrinsic.multiswapSellAsset(args);

    return {
      tx,
      amountOut: '0',
    };
  }
}

export default MangataExchangeNode;
