import { requestFundsFromFaucet } from '../../../utils/wallet/faucet';
import { getNewWallet } from '../../../utils/wallet/Wallet';
import { createSpace } from './createSpace';

const exec = async () => {
  const wallet = await getNewWallet();
  const guardianAddress = await wallet.getNewIotaAddressDetails();
  await requestFundsFromFaucet(guardianAddress.bech32);

  await createSpace(guardianAddress.mnemonic, { name: 'MySpace' });
};

exec();
