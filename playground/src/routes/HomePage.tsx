import { Title, Stack, Alert, Container, Box } from '@mantine/core';
import { transfer, TransactionType, TTxProgressInfo } from '@paraspell/xcm-router';
import { useWallet } from '../providers/WalletProvider';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { IconAlertCircle } from '@tabler/icons-react';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import TransferForm, { FormValues } from '../components/TransferForm';
import TransferStepper from '../components/TransferStepper';

const HomePage = () => {
  const { selectedAccount } = useWallet();

  const [alertOpened, { open: openAlert, close: closeAlert }] = useDisclosure(false);

  const [error, setError] = useState<Error>();

  const [loading, setLoading] = useState(false);

  const [progressInfo, setProgressInfo] = useState<TTxProgressInfo>();

  const [showStepper, setShowStepper] = useState(false);

  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 0,
  });

  useEffect(() => {
    if (error) {
      scrollIntoView();
    }
  }, [error, scrollIntoView]);

  useEffect(() => {
    if (showStepper) {
      scrollIntoView();
    }
  }, [showStepper, scrollIntoView]);

  const onStatusChange = (status: TTxProgressInfo) => {
    setProgressInfo(status);
  };

  const onSubmit = async (formValues: FormValues) => {
    if (!selectedAccount) {
      alert('No account selected, connect wallet first');
      throw Error('No account selected!');
    }

    setLoading(true);

    const injector = await web3FromAddress(selectedAccount.address);

    try {
      setShowStepper(true);
      setProgressInfo(undefined);
      const { recipientAddress, transactionType } = formValues;
      await transfer({
        ...formValues,
        injectorAddress: selectedAccount.address,
        recipientAddress: recipientAddress,
        signer: injector.signer,
        type: TransactionType[transactionType],
        onStatusChange,
      });
      alert('Transaction was successful!');
    } catch (e) {
      if (e instanceof Error) {
        console.error(e);
        setError(e);
        openAlert();
        setShowStepper(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const alertIcon = <IconAlertCircle size={24} />;

  const onAlertCloseClick = () => {
    closeAlert();
  };

  return (
    <Container>
      <Stack gap="xl">
        <Stack w="100%" maw={400} mx="auto" gap="lg">
          <Title order={3}>New SpellRouter transfer</Title>
          <TransferForm onSubmit={onSubmit} loading={loading} />
        </Stack>
        <Box ref={targetRef}>
          {showStepper && (
            <Box mt="md">
              <TransferStepper progressInfo={progressInfo} />
            </Box>
          )}
          {alertOpened && (
            <Alert
              title="Error"
              icon={alertIcon}
              withCloseButton
              onClose={onAlertCloseClick}
              mt="lg"
              style={{ overflowWrap: 'anywhere' }}
            >
              {error?.message}
            </Alert>
          )}
        </Box>
      </Stack>
    </Container>
  );
};

export default HomePage;
