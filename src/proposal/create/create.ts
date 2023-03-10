import {
  MIN_IOTA_AMOUNT,
  ProposalSubType,
  ProposalType,
  TangleRequestType,
} from "@soonaverse/interfaces";
import dayjs from "dayjs";
import config from "../../config.json";
import { getResponseBlockMetadata } from "../../utils/wallet/block.utils";
import { getNewWallet } from "../../utils/wallet/Wallet";

export const createProposal = async () => {
  console.log("Sending proposal create request");

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);
  const metadata = JSON.stringify({
    request: { requestType: TangleRequestType.PROPOSAL_CREATE, ...proposalRequest },
  });

  const blockId = await wallet.send(
    sender,
    config.tangleRequestBech32,
    0.5 * MIN_IOTA_AMOUNT,
    [],
    metadata
  );

  const responseMetadata = await getResponseBlockMetadata(
    blockId,
    wallet.client
  );
  console.log(responseMetadata.response, "\n\n");

  return responseMetadata.response;
};

const proposalRequest = {
  name: "All 4 HORNET",
  space: "0x8a144a9e14bb9ffabf4ed52a1828e8a91a2e65c0",
  additionalInfo: "The biggest governance decision in the history of IOTA",
  settings: {
    startDate: dayjs().subtract(1, "d").toDate(),
    endDate: dayjs().add(5, "d").toDate(),
    onlyGuardians: false,
  },
  type: ProposalType.MEMBERS,
  subType: ProposalSubType.ONE_MEMBER_ONE_VOTE,
  questions: [
    {
      text: "Give all the funds to the HORNET developers?",
      answers: [
        { value: 1, text: "YES", additionalInfo: "Go team!" },
        {
          value: 2,
          text: "Doh! Of course!",
          additionalInfo: "There is no other option",
        },
      ],
      additionalInfo: "This would fund the development of HORNET indefinitely",
    },
  ],
};
