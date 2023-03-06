import { MIN_IOTA_AMOUNT, TangleRequestType } from "@soonaverse/interfaces";
import config from "../../config.json";
import { getResponseBlockMetadata } from "../../utils/wallet/block.utils";
import { getNewWallet } from "../../utils/wallet/Wallet";
import award from "./award.json";

export const createAward = async () => {
  console.log("Sending award create request");

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);
  const metadata = JSON.stringify({
    request: { requestType: TangleRequestType.AWARD_CREATE, ...award },
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
