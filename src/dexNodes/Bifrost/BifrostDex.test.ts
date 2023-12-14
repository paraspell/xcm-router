import { describe, expect, it } from 'vitest';
import BifrostExchangeNode from './BifrostDex';
import { type TSwapOptions } from '../../types';
import { createApiInstanceForNode } from '@paraspell/sdk';
import { calculateTransactionFee } from '../../utils';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from '../../transfer/utils';

describe('BifrostDex', () => {
  // it('should calculate transaction fee correctly', async () => {});

  it('should build a transfer extrinsic without error', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'DOT',
      currencyTo: 'BNC',
      amount: '5000000000',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };
    const dex = new BifrostExchangeNode('BifrostPolkadot');
    const swapApi = await dex.createApiInstance();
    const swapOptions = {
      ...options,
      destinationNode: 'Polkadot',
      exchangeNode: 'BifrostPolkadot',
      originNode: 'HydraDX',
      address: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    } as any;
    const originApi = await createApiInstanceForNode(swapOptions.originNode);
    const toDestTx = buildFromExchangeExtrinsic(swapApi, swapOptions, options.amount);
    const toExchangeTx = buildToExchangeExtrinsic(originApi, swapOptions);
    const toDestTransactionFee = await calculateTransactionFee(toDestTx, options.injectorAddress);
    const toExchangeTransactionFee = await calculateTransactionFee(
      toExchangeTx,
      options.injectorAddress,
    );
    const tx = await dex.swapCurrency(
      swapApi,
      options,
      toDestTransactionFee,
      toExchangeTransactionFee,
    );
    expect(tx).toBeDefined();
  });
});
