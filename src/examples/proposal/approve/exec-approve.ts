import { Build5Env, ProposalRepository } from '@build-5/lib';
import { wait } from '../../../utils/wait';
import { createProposal } from '../create/create';
import { approveProposal } from './approve';

const exec = async () => {
  const { proposal: proposalUid } = await createProposal();
  await approveProposal(proposalUid);

  const proposalRepo = new ProposalRepository(Build5Env.TEST);

  await wait(async () => {
    const proposal = await proposalRepo.getById(proposalUid);
    if (proposal?.approved) {
      console.log('Proposal approved by', proposal?.approvedBy);
    }
    return proposal?.approved || false;
  });
};

exec();
