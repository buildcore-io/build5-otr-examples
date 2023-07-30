import { MIN_IOTA_AMOUNT, TangleRequestType } from '@build-5/interfaces';
import config from '../../../config.json';
import { getNewWallet } from '../../../utils/wallet/Wallet';
import { getResponseBlockMetadata } from '../../../utils/wallet/block.utils';

export const joinSpace = async (mnemonic: string, space: string) => {
  console.log('Sending space join request');

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(mnemonic);
  const metadata = JSON.stringify({
    request: {
      requestType: TangleRequestType.SPACE_JOIN,
      uid: space,
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
