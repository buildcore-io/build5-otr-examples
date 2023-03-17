import { MIN_IOTA_AMOUNT, TangleRequestType } from '@soonaverse/interfaces';
import config from '../../../config.json';
import { getResponseBlockMetadata } from '../../../utils/wallet/block.utils';
import { getNewWallet } from '../../../utils/wallet/Wallet';

export const addGuardian = async (mnemonic: string, space: string, member: string) => {
  console.log('Add guardian to space');

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(mnemonic);
  const metadata = JSON.stringify({
    request: {
      requestType: TangleRequestType.SPACE_ADD_GUARDIAN,
      uid: space,
      member,
    },
  });

  const blockId = await wallet.send(
    sender,
    config.tangleRequestBech32,
    0.5 * MIN_IOTA_AMOUNT,
    [],
    metadata,
  );

  const responseMetadata = await getResponseBlockMetadata(blockId, wallet.client);
  console.log(responseMetadata.response, '\n\n');

  return responseMetadata.response;
};
