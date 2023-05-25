import {
  IAliasAddress,
  IIssuerFeature,
  INftAddress,
  INftOutput,
  ISSUER_FEATURE_TYPE,
  IndexerPluginClient,
} from '@iota/iota.js';
import config from '../../config.json';
import { wait } from '../../utils/wait';
import { getNewWallet } from '../../utils/wallet/Wallet';
import { mintMetadataNft } from './mint-metadata-nft';

const exec = async () => {
  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);

  await mintMetadataNft({ name: 'Test', someValue: 'test' });

  const indexer = new IndexerPluginClient(wallet.client);

  await wait(async () => {
    const items = (await indexer.nfts({ addressBech32: sender.bech32 })).items;
    return items.length === 1;
  });
  const items = (await indexer.nfts({ addressBech32: sender.bech32 })).items;
  const nftOutput = (await wallet.client.output(items[0])).output as INftOutput;

  const issuerFeature = nftOutput.immutableFeatures?.find(
    (f) => f.type === ISSUER_FEATURE_TYPE,
  ) as IIssuerFeature;
  const collectionId = (issuerFeature.address as INftAddress).nftId;

  const collectionItems = (await indexer.nft(collectionId)).items;
  const collectionOutput = (await wallet.client.output(collectionItems[0])).output as INftOutput;
  const collectionIssuer = collectionOutput.immutableFeatures?.find(
    (f) => f.type === ISSUER_FEATURE_TYPE,
  ) as IIssuerFeature;
  const aliasId = (collectionIssuer.address as IAliasAddress).aliasId;

  await mintMetadataNft({ name: 'Test2', someValue: 'test_test2' }, aliasId, collectionId);
};

exec();
