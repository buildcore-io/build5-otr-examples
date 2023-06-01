import { MIN_IOTA_AMOUNT, TangleRequestType } from '@soonaverse/lib';
import { set } from 'lodash';
import config from '../../config.json';
import { getNewWallet } from '../../utils/wallet/Wallet';
import { getResponseBlockMetadata } from '../../utils/wallet/block.utils';

export const mintMetadataNft = async (
  metadata: Record<string, unknown>,
  aliasId?: string,
  collectionId?: string,
  nftId?: string,
) => {
  // If nftId specified we actually update existing NFT. nftId is Digital ID of the device.
  nftId
    ? console.log('Sending update metadata nft request')
    : console.log('Sending mint metadata nft request');

  // Get our wallet and generate senders address from the mnemonic.
  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);

  // Constract On Tangle Request.
  const request = {
    requestType: 'MINT_METADATA_NFT' as TangleRequestType,
    metadata,
  };

  // If Alias provided, set it. This alias must be in control of the SENDERS address.
  aliasId && set(request, 'aliasId', aliasId);

  // Collection where NFT should be added or updated.
  collectionId && set(request, 'collectionId', collectionId);

  // NFT ID that we want to update with new Metadata.
  nftId && set(request, 'nftId', nftId);

  // Send the on tangle request and wait for inclusion.
  const blockId = await wallet.send(
    sender,
    config.tangleRequestBech32,
    MIN_IOTA_AMOUNT * 1,
    [],
    JSON.stringify({ request }),
  );
  console.log('Request send, waiting for response.');

  // Wait for the On Tangle Response.
  const responseMetadata = await getResponseBlockMetadata(blockId, wallet.client);
  console.log('Response: ', responseMetadata.response, '\n\n');

  // Best way to get NftId, CollectionId and Alias ID. Assuming there could be multiple various requests with this wallet.
};
