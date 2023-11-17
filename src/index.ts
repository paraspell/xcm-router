import { Builder, type Extrinsic, InvalidCurrencyError } from '@paraspell/sdk';
import {
  TransactionType,
  type TTransferOptionsModified,
  type TNodeWithRelayChains,
  type TTransferOptions,
  type TTxProgressInfo,
  TransactionStatus,
} from './types';
import createDexNodeInstance from './dexNodes/DexNodeFactory';
import { createApiInstanceForNode, delay, submitTransaction } from './utils';
import { type ApiPromise } from '@polkadot/api';
import type ExchangeNode from './dexNodes/DexNode';

const maybeUpdateStatus = (
  onStatusChange: ((info: TTxProgressInfo) => void) | undefined,
  info: TTxProgressInfo,
): void => {
  if (onStatusChange !== undefined) {
    onStatusChange(info);
  }
};

export const transfer = async (options: TTransferOptions): Promise<void> => {
  const exchangeNode = createDexNodeInstance(options.exchangeNode);
  const modifiedOptions: TTransferOptionsModified = { ...options, exchangeNode: exchangeNode.node };
  console.log('Executing transfer');

  const { onStatusChange, originNode } = modifiedOptions;

  if (options.type === TransactionType.TO_EXCHANGE) {
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    const originApi = await createApiInstanceForNode(originNode);
    await transferToExchange(originApi, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.SUCCESS,
    });
  } else if (options.type === TransactionType.SWAP) {
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.SWAP,
      status: TransactionStatus.IN_PROGRESS,
    });
    const swapApi = await exchangeNode.createApiInstance();
    await swap(swapApi, exchangeNode, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.SWAP,
      status: TransactionStatus.SUCCESS,
    });
  } else if (options.type === TransactionType.FROM_EXCHANGE) {
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    const swapApi = await exchangeNode.createApiInstance();
    await transferToDestination(swapApi, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      status: TransactionStatus.SUCCESS,
    });
  } else {
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    const originApi = await createApiInstanceForNode(originNode);
    await transferToExchange(originApi, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.SUCCESS,
    });
    await delay(1000);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.SWAP,
      status: TransactionStatus.IN_PROGRESS,
    });
    const swapApi = await exchangeNode.createApiInstance();
    await swap(swapApi, exchangeNode, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.SWAP,
      status: TransactionStatus.SUCCESS,
    });
    await delay(1000);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
    });
    await transferToDestination(swapApi, modifiedOptions);
    maybeUpdateStatus(onStatusChange, {
      type: TransactionType.FROM_EXCHANGE,
      status: TransactionStatus.SUCCESS,
    });
  }
};

const validateCurrency = (originNode: TNodeWithRelayChains, currency: string): void => {
  if (
    (originNode === 'Polkadot' && currency !== 'DOT') ||
    (originNode === 'Kusama' && currency !== 'KSM')
  ) {
    throw new InvalidCurrencyError(`Invalid currency for ${originNode}`);
  }
};

const buildToExchangeExtrinsic = (
  api: ApiPromise,
  { originNode, exchangeNode, currencyFrom, amount, injectorAddress }: TTransferOptionsModified,
): Extrinsic => {
  const builder = Builder(api);
  if (originNode === 'Polkadot' || originNode === 'Kusama') {
    return builder.to(exchangeNode).amount(amount).address(injectorAddress).build();
  }
  return builder
    .from(originNode)
    .to(exchangeNode)
    .currency(currencyFrom)
    .amount(amount)
    .address(injectorAddress)
    .build();
};

const buildFromExchangeExtrinsic = (
  api: ApiPromise,
  { destinationNode, exchangeNode, currencyTo, amount, address }: TTransferOptionsModified,
): Extrinsic => {
  const builder = Builder(api);
  if (destinationNode === 'Polkadot' || destinationNode === 'Kusama') {
    return builder.from(exchangeNode).amount(amount).address(address).build();
  }
  return builder
    .from(exchangeNode)
    .to(destinationNode)
    .currency(currencyTo)
    .amount(amount)
    .address(address)
    .build();
};

export const swap = async (
  api: ApiPromise,
  exchangeNode: ExchangeNode,
  options: TTransferOptionsModified,
): Promise<void> => {
  const { signer, injectorAddress } = options;
  const tx = await exchangeNode.swapCurrency(api, options);
  await submitTransaction(api, tx, signer, injectorAddress);
};

export const transferToExchange = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
): Promise<void> => {
  console.log('Transfering to exchange chain');
  const { originNode, currencyFrom, signer, injectorAddress } = options;
  validateCurrency(originNode, currencyFrom);
  const tx = buildToExchangeExtrinsic(api, options);
  await submitTransaction(api, tx, signer, injectorAddress);
};

export const transferToDestination = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
): Promise<void> => {
  console.log('transfering to destination chain');
  const { destinationNode, currencyTo, signer, injectorAddress } = options;
  validateCurrency(destinationNode, currencyTo);
  const tx = buildFromExchangeExtrinsic(api, options);
  await submitTransaction(api, tx, signer, injectorAddress);
};

export * from './types';
export * from './consts/consts';
