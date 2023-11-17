/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { vi, describe, it, expect, beforeEach, type MockInstance } from 'vitest';
import * as transferToExchange from './transferToExchange';
import * as swap from './swap';
import * as transferToDestination from './transferToDestination';
import { transfer } from './transfer';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import { TransactionType, type TTransferOptions } from '../types';
import { createApiInstanceForNode } from '@paraspell/sdk';
import { type ApiPromise } from '@polkadot/api';

const paraspell = { createApiInstanceForNode };

describe('transfer', () => {
  let transferToExchangeSpy: MockInstance;
  let swapSpy: MockInstance;
  let transferToDestinationSpy: MockInstance;

  beforeEach(() => {
    transferToExchangeSpy = vi
      .spyOn(transferToExchange, 'transferToExchange')
      .mockResolvedValue('');
    swapSpy = vi.spyOn(swap, 'swap').mockResolvedValue({ amountOut: '', txHash: '' });
    transferToDestinationSpy = vi
      .spyOn(transferToDestination, 'transferToDestination')
      .mockResolvedValue('');

    vi.spyOn(paraspell, 'createApiInstanceForNode').mockResolvedValue({} as ApiPromise);
  });

  it('main transfer function - FULL_TRANSFER scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchangeNode: 'AcalaDex',
      type: TransactionType.FULL_TRANSFER,
    };
    await transfer(options);
    expect(transferToExchangeSpy).toHaveBeenCalled();
    expect(swapSpy).toHaveBeenCalled();
    expect(transferToDestinationSpy).toHaveBeenCalled();
  });

  it('main transfer function - TO_EXCHANGE scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchangeNode: 'AcalaDex',
      type: TransactionType.TO_EXCHANGE,
    };
    await transfer(options);
    expect(transferToExchangeSpy).toHaveBeenCalled();
    expect(swapSpy).not.toHaveBeenCalled();
    expect(transferToDestinationSpy).not.toHaveBeenCalled();
  });

  it('main transfer function - SWAP scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchangeNode: 'AcalaDex',
      type: TransactionType.SWAP,
    };
    await transfer(options);
    expect(transferToExchangeSpy).not.toHaveBeenCalled();
    expect(swapSpy).toHaveBeenCalled();
    expect(transferToDestinationSpy).not.toHaveBeenCalled();
  });

  it('main transfer function - TO_DESTINATION scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchangeNode: 'AcalaDex',
      type: TransactionType.TO_DESTINATION,
    };
    await transfer(options);
    expect(transferToExchangeSpy).not.toHaveBeenCalled();
    expect(swapSpy).not.toHaveBeenCalled();
    expect(transferToDestinationSpy).toHaveBeenCalled();
  });
});
