import { MIN_IOTA_AMOUNT, TangleRequestType } from '@build-5/interfaces';
import { AwardParticipantRepository, Build5Env } from '@build-5/lib';
import { getNewWallet } from '../../utils/wallet/Wallet';
import { getResponseBlockMetadata } from '../../utils/wallet/block.utils';
import config from './../../config.json';
import intConfig from './integration-config.json';

const exec = async () => {
  console.log('Getting latest data from crew3...');
  fetch('https://api.crew3.xyz/communities/' + intConfig.crew3CommunityName + '/claimed-quests', {
    method: 'GET',
    headers: {
      'x-api-key': intConfig.crew3Api,
    },
  }).then(async (obj) => {
    const out = await obj.json();
    if (!out && out.data) {
      console.error('No data tp process');
      return;
    }
    const filtered = out.data.filter((o: any) => {
      return o.questId === intConfig.questUid && o.user?.addresses?.ethereum;
    });

    console.log('Total completed quests in crew3: ', filtered.length);
    const allEthAddresses = filtered.map((r: any) => {
      return r.user?.addresses.ethereum;
    });

    const participantsRepo = new AwardParticipantRepository(Build5Env.PROD);
    const wallet = await getNewWallet();
    const sender = await wallet.getIotaAddressDetails(config.mnemonic);
    const finalList: string[] = [];
    // Check if user already been given badges in Soonaverse, if not issue one.
    process.stdout.write('Checking if they were already given badge...');
    for (const e of allEthAddresses) {
      // You could run this in parallel you just need to handle max requests per seconds allowed by Soon API.
      const out = await participantsRepo.getById(intConfig.awardUid, e);
      if (!Object.keys(out).length) {
        finalList.push(e);
      }
      process.stdout.write('.');
    }
    console.log('');

    if (finalList.length > 0) {
      // Not yet participant, let's give them badges.
      const metadata = JSON.stringify({
        request: {
          requestType: TangleRequestType.AWARD_APPROVE_PARTICIPANT,
          award: intConfig.awardUid,
          members: finalList.slice(0, 2),
        },
      });

      // Construct and send the block.
      console.log('Sending request to issue new badges for ' + finalList.length + ' participants.');
      const blockId = await wallet.send(
        sender,
        config.tangleRequestBech32,
        0.5 * MIN_IOTA_AMOUNT,
        [],
        metadata,
      );

      // Monitor output
      const responseMetadata = await getResponseBlockMetadata(blockId, wallet.client);
      responseMetadata.response && console.log(responseMetadata.response);
    }
    return;
  });
};

console.log('Query checks for new quests every 15 minutes');
exec();
setInterval(() => {
  exec();
}, 15 * 60 * 1000);
