import { wait } from '../wait';
import { getNewWallet } from './Wallet';

const FAUCET_URL = 'https://faucet.testnet.shimmer.network/api/enqueue';

export const requestFundsFromFaucet = async (address: string) => {
  const response = await fetch(FAUCET_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });
  if (response.ok) {
    console.log('Funds request send, waiting for arrival');

    const wallet = await getNewWallet();
    await wait(async () => {
      const balance = await wallet.getBalance(address);
      return balance > 0;
    });
  } else {
    const error = await response.json();
    console.error('Failed to request funds:', error);
  }
};
