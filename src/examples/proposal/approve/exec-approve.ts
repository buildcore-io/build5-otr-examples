import { ProposalRepository, SoonEnv } from "@soonaverse/lib";
import { wait } from "../../../utils/wait";
import { createProposal } from "../create/create";
import { approveProposal } from "./approve";

const exec = async () => {
  const { proposal: proposalUid } = await createProposal();
  await approveProposal(proposalUid);

  const proposalRepo = new ProposalRepository(SoonEnv.TEST);

  await wait(async () => {
    const proposal = await proposalRepo.getById(proposalUid);
    if (proposal.approved) {
      console.log("Proposal approved by", proposal.approvedBy);
    }
    return proposal.approved || false;
  });
};

exec();
