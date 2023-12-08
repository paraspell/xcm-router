import { InvalidCurrencyError } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { BN } from '@polkadot/util';
import { type TSwapResult, type TSwapOptions } from '../../types';
import { getAssetInfo, getMinAmountOut } from './utils';
import { type ApiPromise } from '@polkadot/api';
import { Mangata, type MangataInstance, type MultiswapSellAsset } from '@mangata-finance/sdk';
import BigNumber from 'bignumber.js';
import { FEE_BUFFER } from '../../consts/consts';

class MangataExchangeNode extends ExchangeNode {
  constructor() {
    super('Mangata');
  }

  private static readonly FIXED_FEE = 0.03 * FEE_BUFFER;

  async swapCurrency(api: ApiPromise, options: TSwapOptions): Promise<TSwapResult> {
    console.log('Swapping currency on Mangata');

    const { currencyFrom, currencyTo, amount, slippagePct, injectorAddress } = options;

    const mangata: MangataInstance = Mangata.instance(['wss://kusama-archive.mangata.online']);

    const assetFromInfo = await getAssetInfo(mangata, currencyFrom);
    const assetToInfo = await getAssetInfo(mangata, currencyTo);

    if (assetFromInfo === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (assetToInfo === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const amountBN = new BigNumber(amount);

    const amountWithoutFee = amountBN.multipliedBy(1 - MangataExchangeNode.FIXED_FEE);

    const amountOut = await mangata.rpc.calculateSellPriceId(
      assetFromInfo.id,
      assetToInfo.id,
      new BN(amount),
    );

    const minAmountOut = getMinAmountOut(new BigNumber(amountOut.toString()), slippagePct);

    console.log('Original amount', amount);
    console.log('Amount out', amountOut.toString());
    console.log('Min amount out', minAmountOut.toString());

    const args: MultiswapSellAsset = {
      account: injectorAddress,
      tokenIds: [assetFromInfo.id, assetToInfo.id],
      amount: new BN(amountWithoutFee.toString()),
      minAmountOut: new BN(minAmountOut.toString()),
    };
    const tx = await mangata.submitableExtrinsic.multiswapSellAsset(args);

    return {
      tx,
      amountOut: amountOut.toString(),
    };
  }
}

export default MangataExchangeNode;
