import {
  IAliasAddress,
  IIssuerFeature,
  INftAddress,
  INftOutput,
  ISSUER_FEATURE_TYPE,
  IndexerPluginClient,
  TransactionHelper,
} from '@iota/iota.js';
import config from '../../config.json';
import { wait } from '../../utils/wait';
import { getNewWallet } from '../../utils/wallet/Wallet';
import { getLedgerInclusionState } from '../../utils/wallet/block.utils';
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
  const nftId = TransactionHelper.resolveIdFromOutputId(items[0]);
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

  const blockId = await wallet.sendNft(sender, config.tangleRequestBech32);
  await getLedgerInclusionState(blockId, wallet.client);

  await mintMetadataNft({ name: 'Test2', someValue: 'test_test2' }, aliasId, collectionId, nftId);
};

exec();
