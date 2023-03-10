import {
  MIN_IOTA_AMOUNT,
  NftRepository,
  SoonEnv,
  TangleRequestType,
} from "@soonaverse/lib";
import { head } from "lodash";
import config from "../config.json";
import { getResponseBlockMetadata } from "../utils/wallet/block.utils";
import { getNewWallet } from "../utils/wallet/Wallet";

export const purchaseRandomNft = async (collection: string) => {
  const nft = await getFirstUnsoldNft(collection);
  if (!nft) {
    throw Error("No more unsold nft in this collection");
  }

  console.log("Nft soonaverse id", nft.uid);
  console.log("Nft smr id", nft.mintingData?.nftId, "\n");

  console.log("Sending nft purchase request");

  const wallet = await getNewWallet();
  const sender = await wallet.getIotaAddressDetails(config.mnemonic);
  const metadata = JSON.stringify({
    request: {
      requestType: TangleRequestType.NFT_PURCHASE,
      nft: nft.mintingData?.nftId,
    },
  });

  const blockId = await wallet.send(
    sender,
    config.tangleRequestBech32,
    MIN_IOTA_AMOUNT * 10,
    [],
    metadata
  );

  const responseMetadata = await getResponseBlockMetadata(
    blockId,
    wallet.client
  );

  console.log(responseMetadata.response, "\n");
  if (!responseMetadata.response) {
    console.log(
      "Nft purchased, it should be sent soon to address",
      sender.bech32,
      "\n\n"
    );
  }

  return responseMetadata.response;
};

const getFirstUnsoldNft = async (collection: string) => {
  const nftRepo = new NftRepository(SoonEnv.TEST);
  const nfts = await nftRepo.getByField(
    ["collection", "sold", "locked", "placeholderNft"],
    [collection, false, false, false]
  );
  return head(nfts);
};
