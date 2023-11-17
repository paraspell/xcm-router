import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  buildFromExchangeExtrinsic,
  buildToExchangeExtrinsic,
  submitSwap,
  submitTransferToDestination,
  submitTransferToExchange,
} from './utils';
import { type TSwapResult, type TTransferOptionsModified } from '../types';
import { transferParams } from '../RouterBuilder.test';
import {
  type TNodeWithRelayChains,
  createApiInstanceForNode,
  type Extrinsic,
} from '@paraspell/sdk';
import { type ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import type ExchangeNode from '../dexNodes/DexNode';
import * as transactionUtils from '../utils/submitTransaction';

describe('transfer utils', () => {
  let parachainApi: ApiPromise;
  let relaychainApi: ApiPromise;

  beforeAll(async () => {
    parachainApi = await createApiInstanceForNode('Acala');
    relaychainApi = await createApiInstanceForNode('Polkadot');
  });

  describe('buildToExchangeExtrinsic', () => {
    it('builds correct Extrinsic for Polkadot origin', async () => {
      const originNode: TNodeWithRelayChains = 'Polkadot';
      const options: TTransferOptionsModified = {
        ...transferParams,
        originNode,
        exchangeNode: 'Acala',
      };

      const extrinsic = buildToExchangeExtrinsic(relaychainApi, options);
      expect(extrinsic).toBeDefined();
    });

    it('builds correct Extrinsic for non-Polkadot/Kusama origin', async () => {
      const originNode: TNodeWithRelayChains = 'Astar';
      const options: TTransferOptionsModified = {
        ...transferParams,
        originNode,
        exchangeNode: 'Acala',
      };

      const extrinsic = buildToExchangeExtrinsic(parachainApi, options);
      expect(extrinsic).toBeDefined();
    });
  });

  describe('buildFromExchangeExtrinsic', () => {
    it('builds correct Extrinsic for Polkadot destination', async () => {
      const destinationNode: TNodeWithRelayChains = 'Polkadot';
      const options: TTransferOptionsModified = {
        ...transferParams,
        destinationNode,
        exchangeNode: 'Acala',
      };
      const extrinsic = buildFromExchangeExtrinsic(parachainApi, options, '10000000000');
      expect(extrinsic).toBeDefined();
    });

    it('builds correct Extrinsic for non-Polkadot/Kusama destination', async () => {
      const destinationNode: TNodeWithRelayChains = 'Astar';
      const options: TTransferOptionsModified = {
        ...transferParams,
        destinationNode,
        exchangeNode: 'Acala',
      };
      const extrinsic = buildFromExchangeExtrinsic(parachainApi, options, '10000000000');
      expect(extrinsic).toBeDefined();
    });
  });

  class MockExchangeNode {
    async swapCurrency(): Promise<TSwapResult> {
      return {
        tx: {
          signAsync: vi.fn().mockResolvedValue('signedTx'),
          send: vi.fn().mockResolvedValue('sentTx'),
        } as unknown as Extrinsic,
        amountOut: '1000',
      };
    }
  }

  describe('submitSwap', () => {
    it('submits a swap and returns amountOut and txHash', async () => {
      const spy = vi.spyOn(transactionUtils, 'submitTransaction').mockResolvedValue('mockedTxHash');
      const exchangeNode = new MockExchangeNode();
      const options: TTransferOptionsModified = {
        ...transferParams,
        exchangeNode: 'Acala',
      };
      const toDestTransactionFee = new BigNumber(10);
      const toExchangeTransactionFee = new BigNumber(5);

      const result = await submitSwap(
        parachainApi,
        exchangeNode as unknown as ExchangeNode,
        options,
        toDestTransactionFee,
        toExchangeTransactionFee,
      );

      expect(result).toBeDefined();
      expect(result.amountOut).toBe('1000');
      expect(result.txHash).toBe('mockedTxHash');
      expect(spy).toHaveBeenCalledWith(
        parachainApi,
        expect.objectContaining({
          signAsync: expect.any(Function),
          send: expect.any(Function),
        }),
        options.signer,
        options.injectorAddress,
      );
    });
  });

  describe('submitTransferToExchange', () => {
    it('submits a transfer and returns a transaction hash', async () => {
      const spy = vi.spyOn(transactionUtils, 'submitTransaction').mockResolvedValue('mockedTxHash');
      const options: TTransferOptionsModified = {
        ...transferParams,
        exchangeNode: 'Acala',
      };
      const result = await submitTransferToExchange(relaychainApi, options);

      expect(result).toBe('mockedTxHash');
      expect(spy).toHaveBeenCalledWith(
        relaychainApi,
        expect.objectContaining({
          signAsync: expect.any(Function),
          send: expect.any(Function),
        }),
        options.signer,
        options.injectorAddress,
      );
    });
  });

  describe('submitTransferToDestination', () => {
    it('submits a transfer and returns a transaction hash', async () => {
      const spy = vi.spyOn(transactionUtils, 'submitTransaction').mockResolvedValue('mockedTxHash');
      const options: TTransferOptionsModified = {
        ...transferParams,
        exchangeNode: 'Acala',
      };
      const result = await submitTransferToDestination(parachainApi, options, '10000000000');

      expect(result).toBe('mockedTxHash');
      expect(spy).toHaveBeenCalledWith(
        parachainApi,
        expect.objectContaining({
          signAsync: expect.any(Function),
          send: expect.any(Function),
        }),
        options.signer,
        options.injectorAddress,
      );
    });
  });
});
