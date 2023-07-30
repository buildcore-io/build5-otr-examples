import { MIN_IOTA_AMOUNT, TangleRequestType } from '@build-5/lib';
import { IBasicOutput, IndexerPluginClient } from '@iota/iota.js';
import { set } from 'lodash';
import config from '../../config.json';
import { wait } from '../../utils/wait';
import { getNewWallet } from '../../utils/wallet/Wallet';
import { getOutputMetadata } from '../../utils/wallet/output.utils';

export const mintMetadataNft = async (
  metadata: Record<string, unknown>,
  aliasId?: string,
  collectionId?: string,
  nftId?: string,
) => {
  // If nftId specified we actually update existing NFT.
  nftId
    ? console.log('Submitting update metadata nft request...')
    : console.log('Submitting mint metadata nft request...');

  // Get our wallet and generate senders address from the mnemonic.
  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);

  // Your wallet address generated from your mnemonic. This is always same.
  // This address MUST have necessary funds for the storage deposit.
  console.log('Your wallet address: ' + sender.bech32);

  // Constract On Tangle Request.
  const request = {
    requestType: 'MINT_METADATA_NFT' as TangleRequestType,
    metadata,
  };

  // Alias where NFT should be added. This alias must be in control of the SENDERS address.
  aliasId && set(request, 'aliasId', aliasId);

  // Collection where NFT should be added.
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

  console.log('Awaiting response, this might take a minute or two...');

  const indexer = new IndexerPluginClient(wallet.client);
  await wait(async () => {
    const items = (await indexer.basicOutputs({ tagHex: blockId })).items;
    return items.length === 1;
  });

  const items = (await indexer.basicOutputs({ tagHex: blockId })).items;
  const output = (await wallet.client.output(items[0])).output as IBasicOutput;
  const responseMeta = getOutputMetadata(output);
  console.log('Response data: \n', responseMeta);
  console.log('------- \n\n');
  return { aliasId, collectionId, nftId, ...responseMeta };
};
