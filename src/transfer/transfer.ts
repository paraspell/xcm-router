import { createApiInstanceForNode } from '@paraspell/sdk';
import createDexNodeInstance from '../dexNodes/DexNodeFactory';
import { type TTransferOptionsModified, type TTransferOptions, TransactionType } from '../types';
import { delay } from '../utils/utils';
import { transferToExchange } from './transferToExchange';
import { swap } from './swap';
import { transferToDestination } from './transferToDestination';

export const transfer = async (options: TTransferOptions): Promise<void> => {
  const exchangeNode = createDexNodeInstance(options.exchangeNode);
  const modifiedOptions: TTransferOptionsModified = { ...options, exchangeNode: exchangeNode.node };

  const { originNode, amount } = modifiedOptions;

  if (options.type === TransactionType.TO_EXCHANGE) {
    const originApi = await createApiInstanceForNode(originNode);
    await transferToExchange(modifiedOptions, originApi);
  } else if (options.type === TransactionType.SWAP) {
    const originApi = await createApiInstanceForNode(originNode);
    const swapApi = await exchangeNode.createApiInstance();
    await swap(modifiedOptions, exchangeNode, originApi, swapApi);
  } else if (options.type === TransactionType.TO_DESTINATION) {
    const swapApi = await exchangeNode.createApiInstance();
    await transferToDestination(modifiedOptions, amount, swapApi);
  } else {
    const originApi = await createApiInstanceForNode(originNode);
    await transferToExchange(modifiedOptions, originApi);
    await delay(1000);
    const swapApi = await exchangeNode.createApiInstance();
    const { amountOut } = await swap(modifiedOptions, exchangeNode, originApi, swapApi);
    await delay(1000);
    await transferToDestination(modifiedOptions, amountOut, swapApi);
  }
};
