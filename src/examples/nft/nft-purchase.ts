import { MIN_IOTA_AMOUNT, TangleRequestType } from '@build-5/lib';
import config from '../../config.json';
import { getNewWallet } from '../../utils/wallet/Wallet';
import { getResponseBlockMetadata } from '../../utils/wallet/block.utils';

export const purchaseRandomNft = async (collection: string) => {
  console.log('Sending nft purchase request');

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);
  const metadata = JSON.stringify({
    request: {
      requestType: TangleRequestType.NFT_PURCHASE,
      collection: collection,
    },
  });

  const blockId = await wallet.send(
    sender,
    config.tangleRequestBech32,
    MIN_IOTA_AMOUNT * 10,
    [],
    metadata,
  );

  const responseMetadata = await getResponseBlockMetadata(blockId, wallet.client);

  console.log(responseMetadata.response, '\n');
  if (!responseMetadata.response) {
    console.log('Nft purchased, it should be sent soon to address', sender.bech32, '\n\n');
  }

  return responseMetadata.response;
};
