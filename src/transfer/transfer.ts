import { createApiInstanceForNode } from '@paraspell/sdk';
import createDexNodeInstance from '../dexNodes/DexNodeFactory';
import {
  type TTransferOptionsModified,
  type TTransferOptions,
  TransactionType,
  TransactionStatus,
} from '../types';
import { calculateTransactionFee, delay, maybeUpdateTransferStatus } from '../utils/utils';
import {
  buildFromExchangeExtrinsic,
  buildToExchangeExtrinsic,
  swap,
  transferToDestination,
  transferToExchange,
} from './utils';

export const transfer = async (options: TTransferOptions): Promise<void> => {
  const exchangeNode = createDexNodeInstance(options.exchangeNode);
  const modifiedOptions: TTransferOptionsModified = { ...options, exchangeNode: exchangeNode.node };

  const { onStatusChange, originNode, amount, injectorAddress } = modifiedOptions;

  if (options.type === TransactionType.TO_EXCHANGE) {
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    const originApi = await createApiInstanceForNode(originNode);
    const txHash = await transferToExchange(originApi, modifiedOptions);
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      hashes: { [TransactionType.TO_EXCHANGE]: txHash },
      status: TransactionStatus.SUCCESS,
    });
  } else if (options.type === TransactionType.SWAP) {
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.SWAP,
      status: TransactionStatus.IN_PROGRESS,
    });
    const originApi = await createApiInstanceForNode(originNode);
    const swapApi = await exchangeNode.createApiInstance();
    const toDestTx = buildFromExchangeExtrinsic(swapApi, modifiedOptions, amount);
    const toDestTransactionFee = await calculateTransactionFee(toDestTx, injectorAddress);
    const toExchangeTx = buildToExchangeExtrinsic(originApi, modifiedOptions);
    const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, injectorAddress);
    const { txHash } = await swap(
      swapApi,
      exchangeNode,
      modifiedOptions,
      toDestTransactionFee,
      toExchangeTransactionFee,
    );
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.SWAP,
      hashes: { [TransactionType.SWAP]: txHash },
      status: TransactionStatus.SUCCESS,
    });
  } else if (options.type === TransactionType.FROM_EXCHANGE) {
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    const swapApi = await exchangeNode.createApiInstance();
    const txHash = await transferToDestination(swapApi, modifiedOptions, amount);
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      hashes: { [TransactionType.FROM_EXCHANGE]: txHash },
      status: TransactionStatus.SUCCESS,
    });
  } else {
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    const originApi = await createApiInstanceForNode(originNode);
    const txHashToExchange = await transferToExchange(originApi, modifiedOptions);
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      hashes: { [TransactionType.TO_EXCHANGE]: txHashToExchange },
      status: TransactionStatus.SUCCESS,
    });
    await delay(1000);
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.SWAP,
      hashes: { [TransactionType.TO_EXCHANGE]: txHashToExchange },
      status: TransactionStatus.IN_PROGRESS,
    });
    const swapApi = await exchangeNode.createApiInstance();
    const toExchangeTx = buildToExchangeExtrinsic(originApi, modifiedOptions);
    const toDestTx = buildFromExchangeExtrinsic(swapApi, modifiedOptions, amount);
    const toDestTransactionFee = await calculateTransactionFee(toDestTx, injectorAddress);
    const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, injectorAddress);
    const { amountOut, txHash: txHashSwap } = await swap(
      swapApi,
      exchangeNode,
      modifiedOptions,
      toDestTransactionFee,
      toExchangeTransactionFee,
    );
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.SWAP,
      hashes: {
        [TransactionType.TO_EXCHANGE]: txHashToExchange,
        [TransactionType.SWAP]: txHashSwap,
      },
      status: TransactionStatus.SUCCESS,
    });
    await delay(1000);
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      hashes: {
        [TransactionType.TO_EXCHANGE]: txHashToExchange,
        [TransactionType.SWAP]: txHashSwap,
      },
      status: TransactionStatus.IN_PROGRESS,
    });
    const txHashToDest = await transferToDestination(swapApi, modifiedOptions, amountOut);
    maybeUpdateTransferStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      hashes: {
        [TransactionType.TO_EXCHANGE]: txHashToExchange,
        [TransactionType.SWAP]: txHashSwap,
        [TransactionType.FROM_EXCHANGE]: txHashToDest,
      },
      status: TransactionStatus.SUCCESS,
    });
  }
};
