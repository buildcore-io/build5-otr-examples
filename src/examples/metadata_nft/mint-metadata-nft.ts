import { MIN_IOTA_AMOUNT, TangleRequestType } from '@soonaverse/lib';
import { set } from 'lodash';
import config from '../../config.json';
import { getNewWallet } from '../../utils/wallet/Wallet';

export const mintMetadataNft = async (
  metadata: Record<string, unknown>,
  aliasId?: string,
  collectionId?: string,
  nftId?: string,
) => {
  nftId
    ? console.log('Sending update metadata nft request')
    : console.log('Sending mint metadata nft request');

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);
  const request = {
    requestType: 'MINT_METADATA_NFT' as TangleRequestType,
    metadata,
  };
  aliasId && set(request, 'aliasId', aliasId);
  collectionId && set(request, 'collectionId', collectionId);
  nftId && set(request, 'nftId', nftId);

  await wallet.send(
    sender,
    config.tangleRequestBech32,
    MIN_IOTA_AMOUNT * 1,
    [],
    JSON.stringify({ request }),
  );

  nftId
    ? console.log('Request send, the nft metadata will soon beupdated')
    : console.log('Request sent, an nft should appear in your wallet in a couple of minutes.');
};
