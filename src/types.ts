import { type TNodeWithRelayChains, type Extrinsic, type TNode } from '@paraspell/sdk';
import { type Signer } from '@polkadot/types/types';
import { type EXCHANGE_NODES } from './consts';

export type TBigNumber = string | number | bigint;

export type TExchangeNode = (typeof EXCHANGE_NODES)[number];

export interface TSwapOptions {
  currencyFrom: string;
  currencyTo: string;
  amount: string;
  slippagePct: string;
  injectorAddress: string;
}

export interface TSwapResult {
  tx: Extrinsic;
  amountOut: string;
}

export enum TransactionType {
  TO_EXCHANGE = 'TO_EXCHANGE',
  SWAP = 'SWAP',
  TO_DESTINATION = 'TO_DESTINATION',
  FULL_TRANSFER = 'FULL_TRANSFER',
}

export interface TTxProgressInfo {
  type: TransactionType;
  hashes?: {
    [TransactionType.TO_EXCHANGE]?: string;
    [TransactionType.SWAP]?: string;
    [TransactionType.TO_DESTINATION]?: string;
  };
  status: TransactionStatus;
}

export enum TransactionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
}

export interface TTransferOptions {
  originNode: TNodeWithRelayChains;
  exchangeNode: TExchangeNode;
  destinationNode: TNodeWithRelayChains;
  currencyFrom: string;
  currencyTo: string;
  amount: string;
  injectorAddress: string;
  recipientAddress: string;
  slippagePct: string;
  signer: Signer;
  type: TransactionType;
  onStatusChange?: (info: TTxProgressInfo) => void;
}

export type TTransferOptionsModified = Omit<TTransferOptions, 'exchangeNode'> & {
  exchangeNode: TNode;
};
