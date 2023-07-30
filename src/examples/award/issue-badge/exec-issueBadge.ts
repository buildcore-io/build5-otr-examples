import { Award, AwardRepository, Build5Env } from '@build-5/lib';
import config from '../../../config.json';
import { wait } from '../../../utils/wait';
import { getNewWallet } from '../../../utils/wallet/Wallet';
import { createAward } from '../create/create';
import { fundAward } from '../fund/fund';
import { issueBadge } from './issueBadge';

let award: Award | undefined;

const exec = async () => {
  const { award: awardId, address, amount } = await createAward();
  await fundAward(awardId, amount, address);

  const awardRepo = new AwardRepository(Build5Env.TEST);

  await wait(async () => {
    award = await awardRepo.getById(awardId);
    if (!award) {
      return false;
    }

    return award.funded;
  });
  console.log('Award fund request received\n');

  console.log('Minting alias...');
  await wait(async () => {
    award = await awardRepo.getById(awardId);
    if (!award) {
      return false;
    }

    return award.aliasBlockId !== undefined;
  });
  console.log('Award alias block id', award?.aliasBlockId, '\n');

  console.log('Minting collection...');
  await wait(async () => {
    award = await awardRepo.getById(awardId);
    if (!award) {
      return false;
    }

    return award.collectionBlockId !== undefined && award.approved;
  });
  console.log('Award collection block id', award?.collectionBlockId, '\n');
  console.log('Award funded and approved\n\n');

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);
  await issueBadge(awardId, [sender.bech32]);
};

exec();
