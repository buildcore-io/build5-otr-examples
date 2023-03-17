import { requestFundsFromFaucet } from '../../../utils/wallet/faucet';
import { getNewWallet } from '../../../utils/wallet/Wallet';
import { createSpace } from '../create/createSpace';
import { joinSpace } from '../join/join';
import { acceptMember } from './accept.member';

const exec = async () => {
  const wallet = await getNewWallet();

  const guardianAddress = await wallet.getNewIotaAddressDetails();
  const memberAddress = await wallet.getNewIotaAddressDetails();
  const faucetPromisses = [
    requestFundsFromFaucet(guardianAddress.bech32),
    requestFundsFromFaucet(memberAddress.bech32),
  ];
  await Promise.all(faucetPromisses);

  const { space } = await createSpace(guardianAddress.mnemonic, { name: 'MySpace', open: false });

  await requestFundsFromFaucet(memberAddress.bech32);

  await joinSpace(memberAddress.mnemonic, space);

  await acceptMember(guardianAddress.mnemonic, space, memberAddress.bech32);
};

exec();
