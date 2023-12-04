import { type TNode } from '@paraspell/sdk';
import { type TSwapResult, type TSwapOptions } from '../types';
import { type ApiPromise } from '@polkadot/api';
import { createApiInstanceForNode } from '../utils';

abstract class ExchangeNode {
  private readonly _node: TNode;

  constructor(node: TNode) {
    this._node = node;
  }

  get node(): TNode {
    return this._node;
  }

  abstract swapCurrency(api: ApiPromise, options: TSwapOptions): Promise<TSwapResult>;

  async createApiInstance(): Promise<ApiPromise> {
    return await createApiInstanceForNode(this.node);
  }
}

export default ExchangeNode;
