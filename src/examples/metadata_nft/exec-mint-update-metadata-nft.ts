import { IndexerPluginClient, TransactionHelper } from '@iota/iota.js';
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

  const blockId = await wallet.sendNft(sender, config.tangleRequestBech32);
  await getLedgerInclusionState(blockId, wallet.client);

  await mintMetadataNft({ name: 'Test2', someValue: 'test_test2' }, nftId);
};

exec();
