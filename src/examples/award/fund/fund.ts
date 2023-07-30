import { TangleRequestType } from '@build-5/interfaces';
import config from '../../../config.json';
import { getNewWallet } from '../../../utils/wallet/Wallet';
import { getResponseBlockMetadata } from '../../../utils/wallet/block.utils';

export const fundAward = async (award: string, amount: number, targetBech32: string) => {
  console.log('Funding award', award);

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);
  const metadata = JSON.stringify({
    request: { requestType: TangleRequestType.AWARD_CREATE, uid: award },
  });
  const blockId = await wallet.send(sender, targetBech32, amount, [], metadata);

  const responseMetadata = await getResponseBlockMetadata(blockId, wallet.client);
  responseMetadata.response && console.log(responseMetadata.response);
  return responseMetadata.response;
};
