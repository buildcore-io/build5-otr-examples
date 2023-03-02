import { MIN_IOTA_AMOUNT, TangleRequestType } from "@soonaverse/interfaces";
import config from "../../config.json";
import { getResponseBlockMetadata } from "../../utils/wallet/block.utils";
import { getNewWallet } from "../../utils/wallet/Wallet";

export const issueBadge = async (award: string, members: string[]) => {
  console.log("Issuing badges for award", award);

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);
  const metadata = JSON.stringify({
    request: {
      requestType: TangleRequestType.AWARD_APPROVE_PARTICIPANT,
      award,
      members,
    },
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
  responseMetadata.response && console.log(responseMetadata.response);
  return responseMetadata.response;
};
