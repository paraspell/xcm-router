import { useForm } from '@mantine/form';
import {
  EXCHANGE_NODES,
  NODES_WITH_RELAY_CHAIN,
  TExchangeNode,
  TNodeWithRelayChains,
  TransactionType,
} from '@paraspell/xcm-router';
import { isValidWalletAddress } from '../utils';
import { FC } from 'react';
import { Button, Select, Stack, TextInput } from '@mantine/core';

export type FormValues = {
  originNode: TNodeWithRelayChains;
  exchangeNode: TExchangeNode;
  destinationNode: TNodeWithRelayChains;
  currencyFrom: string;
  currencyTo: string;
  recipientAddress: string;
  amount: string;
  slippagePct: string;
  transactionType: keyof typeof TransactionType;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
};

const TransferForm: FC<Props> = ({ onSubmit, loading }) => {
  const form = useForm<FormValues>({
    initialValues: {
      originNode: 'Astar',
      exchangeNode: 'HydraDxDex',
      destinationNode: 'Moonbeam',
      currencyFrom: 'ASTR',
      currencyTo: 'GLMR',
      amount: '10000000000000000000',
      recipientAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
      slippagePct: '1',
      transactionType: 'SWAP',
    },

    validate: {
      recipientAddress: (value) => (isValidWalletAddress(value) ? null : 'Invalid address'),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Origin node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAIN]}
          searchable
          required
          {...form.getInputProps('originNode')}
        />

        <Select
          label="Exchange node"
          placeholder="Pick value"
          data={[...EXCHANGE_NODES]}
          searchable
          required
          {...form.getInputProps('exchangeNode')}
        />

        <Select
          label="Destination node"
          placeholder="Pick value"
          data={[...NODES_WITH_RELAY_CHAIN]}
          searchable
          required
          {...form.getInputProps('destinationNode')}
        />

        <TextInput
          label="Currency from"
          placeholder="ASTR"
          required
          {...form.getInputProps('currencyFrom')}
        />

        <TextInput
          label="Currency to"
          placeholder="GLMR"
          required
          {...form.getInputProps('currencyTo')}
        />

        <TextInput
          label="Recipient address"
          placeholder="0x0000000"
          required
          {...form.getInputProps('recipientAddress')}
        />

        <TextInput label="Amount" placeholder="0" required {...form.getInputProps('amount')} />

        <Select
          label="Transaction type"
          placeholder="Pick value"
          data={[
            TransactionType.TO_EXCHANGE.toString(),
            TransactionType.FROM_EXCHANGE.toString(),
            TransactionType.SWAP.toString(),
            TransactionType.FULL_TRANSFER.toString(),
          ]}
          searchable
          required
          {...form.getInputProps('transactionType')}
        />

        <TextInput
          label="Slippage percentage (%)"
          placeholder="1"
          required
          {...form.getInputProps('slippagePct')}
        />

        <Button type="submit" loading={loading}>
          Submit transaction
        </Button>
      </Stack>
    </form>
  );
};

export default TransferForm;
