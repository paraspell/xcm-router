import { type TNode } from '@paraspell/sdk';
import { type TSwapResult, type TSwapOptions } from '../types';
import { type ApiPromise } from '@polkadot/api';
import { createApiInstanceForNode } from '../utils';
import type BigNumber from 'bignumber.js';

abstract class ExchangeNode {
  private readonly _node: TNode;

  constructor(node: TNode) {
    this._node = node;
  }

  get node(): TNode {
    return this._node;
  }

  abstract swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSwapResult>;

  async createApiInstance(): Promise<ApiPromise> {
    return await createApiInstanceForNode(this.node);
  }
}

export default ExchangeNode;
