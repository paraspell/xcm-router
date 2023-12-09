import { describe, expect, it } from 'vitest';
import AcalaExchangeNode from './AcalaDex';
import { type TSwapOptions } from '../../types';
import { calculateTransactionFee, createApiInstanceForNode } from '../../utils';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from '../..';
// import BigNumber from 'bignumber.js';

describe.skip('Acala utils', () => {
  // it('should calculate transaction fee correctly', async () => {});

  it('should build a transfer extrinsic without error on Acala', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'DOT',
      currencyTo: 'UNQ',
      amount: '5000000000',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };

    const dex = new AcalaExchangeNode('Acala');
    const swapApi = await dex.createApiInstance();
    const swapOptions = {
      ...options,
      destinationNode: 'Unique',
      exchangeNode: 'Acala',
      originNode: 'Polkadot',
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

  it.skip('should build a transfer extrinsic without error on Karura', async () => {
    const options: TSwapOptions = {
      currencyFrom: 'KSM',
      currencyTo: 'KAR',
      amount: '22000000000000',
      slippagePct: '1',
      injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
    };

    const dex = new AcalaExchangeNode('Karura');
    const swapApi = await dex.createApiInstance();
    const swapOptions = {
      ...options,
      destinationNode: 'Robonomics',
      exchangeNode: 'Karura',
      originNode: 'Kusama',
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
