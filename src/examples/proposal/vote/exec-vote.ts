import { Build5Env, ProposalRepository } from '@build-5/lib';
import { wait } from '../../../utils/wait';
import { approveProposal } from '../approve/approve';
import { createProposal } from '../create/create';
import { voteOnProposal } from './vote';

const exec = async () => {
  const { proposal: proposalUid } = await createProposal();

  await approveProposal(proposalUid);
  const proposalRepo = new ProposalRepository(Build5Env.TEST);
  await wait(async () => {
    const proposal = await proposalRepo.getById(proposalUid);
    return proposal?.approved || false;
  });

  await voteOnProposal(proposalUid, [1]);

  await wait(async () => {
    const proposal = await proposalRepo.getById(proposalUid);
    return proposal?.results.answers[1] === 1;
  });

  const proposal = await proposalRepo.getById(proposalUid);
  console.log(proposal?.results);
};

exec();
