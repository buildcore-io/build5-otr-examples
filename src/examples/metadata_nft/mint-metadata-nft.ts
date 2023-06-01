import { MIN_IOTA_AMOUNT, TangleRequestType } from '@soonaverse/lib';
import { set } from 'lodash';
import config from '../../config.json';
import { getNewWallet } from '../../utils/wallet/Wallet';
import { getLedgerInclusionState, getResponseBlockMetadata } from '../../utils/wallet/block.utils';

export const mintMetadataNft = async (
  metadata: Record<string, unknown>,
  aliasId?: string,
  collectionId?: string,
  nftId?: string,
) => {
  // If nftId specified we actually update existing NFT. nftId is Digital ID of the device.
  nftId
    ? console.log('Submitting update metadata nft request...')
    : console.log('Submitting mint metadata nft request...');

  // Get our wallet and generate senders address from the mnemonic.
  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);

  // Your wallet address generated from your mnemonic.
  // This address MUST have necessary funds for the storage deposit.
  console.log('Your wallet address: ' + sender.bech32);

  // Constract On Tangle Request.
  const request = {
    requestType: 'MINT_METADATA_NFT' as TangleRequestType,
    metadata,
  };

  // If Alias provided, set it. This alias must be in control of the SENDERS address.
  aliasId && set(request, 'aliasId', aliasId);

  // Collection where NFT should be added or updated.
  collectionId && set(request, 'collectionId', collectionId);

  if (nftId) {
    // NFT ID that we want to update with new Metadata.
    set(request, 'nftId', nftId);

    // We have to send the NFT to Soonaverse.
    console.log('Sending NFT to Soonaverse so it can be updated...');
    const blockId = await wallet.sendNft(sender, config.tangleRequestBech32, nftId);
    console.log(
      'Nft transfer completed ' + 'https://explorer.shimmer.network/shimmer/block/' + blockId,
    );
    await getLedgerInclusionState(blockId, wallet.client);
  }

  // Send the on tangle request and wait for inclusion.
  const blockId = await wallet.send(
    sender,
    config.tangleRequestBech32,
    MIN_IOTA_AMOUNT * 1,
    [],
    JSON.stringify({ request }),
  );

  // Wait for the On Tangle Response.
  const responseMetadata = await getResponseBlockMetadata(blockId, wallet.client);
  console.log('Response: ', responseMetadata.response, '\n\n');

  // Best way to get NftId, CollectionId and Alias ID. Assuming there could be multiple various requests with this wallet.
};
