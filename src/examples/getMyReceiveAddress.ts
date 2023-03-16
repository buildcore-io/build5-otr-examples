import config from '../config.json';
import { getNewWallet } from '../utils/wallet/Wallet';

export const getReceiveAddress = async () => {
  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);
  console.log('Your address: ' + sender.bech32);
};

getReceiveAddress();
