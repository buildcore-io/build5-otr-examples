import { Ed25519 } from "@iota/crypto.js";
import {
  DEFAULT_PROTOCOL_VERSION,
  ED25519_SIGNATURE_TYPE,
  IBlock,
  IKeyPair,
  ISignatureUnlock,
  ITransactionEssence,
  ITransactionPayload,
  IUTXOInput,
  OutputTypes,
  SIGNATURE_UNLOCK_TYPE,
  SingleNodeClient,
  TAGGED_DATA_PAYLOAD_TYPE,
  TransactionHelper,
  TRANSACTION_ESSENCE_TYPE,
  TRANSACTION_PAYLOAD_TYPE,
  UnlockTypes,
} from "@iota/iota.js";
import { Converter } from "@iota/util.js";
import { KEY_NAME_TANGLE } from "@soonaverse/interfaces";
import { wait } from "../wait";
import { SmrWallet } from "./Wallet";

export const packEssence = (
  inputs: IUTXOInput[],
  inputsCommitment: string,
  outputs: OutputTypes[],
  wallet: SmrWallet
) =>
  <ITransactionEssence>{
    type: TRANSACTION_ESSENCE_TYPE,
    networkId: TransactionHelper.networkIdFromNetworkName(
      wallet.info.protocol.networkName
    ),
    inputs,
    outputs,
    inputsCommitment,
    payload: {
      type: TAGGED_DATA_PAYLOAD_TYPE,
      tag: Converter.utf8ToHex(KEY_NAME_TANGLE, true),
    },
  };

export const createUnlock = (
  essence: ITransactionEssence,
  keyPair: IKeyPair
): ISignatureUnlock => {
  const essenceHash = TransactionHelper.getTransactionEssenceHash(essence);
  return {
    type: SIGNATURE_UNLOCK_TYPE,
    signature: {
      type: ED25519_SIGNATURE_TYPE,
      publicKey: Converter.bytesToHex(keyPair.publicKey, true),
      signature: Converter.bytesToHex(
        Ed25519.sign(keyPair.privateKey, essenceHash),
        true
      ),
    },
  };
};

export const submitBlock = async (
  wallet: SmrWallet,
  payload: ITransactionPayload
): Promise<string> => {
  const block: IBlock = {
    protocolVersion: DEFAULT_PROTOCOL_VERSION,
    parents: [],
    payload,
    nonce: "0",
  };
  return await wallet.client.blockSubmit(block);
};

export const packPayload = (
  essence: ITransactionEssence,
  unlocks: UnlockTypes[]
) => <ITransactionPayload>{ type: TRANSACTION_PAYLOAD_TYPE, essence, unlocks };

export const getLedgerInclusionState = async (
  blockId: string,
  client: SingleNodeClient
) => {
  let ledgerInclusionState: string | undefined = undefined;
  await wait(async () => {
    const metadata = await client.blockMetadata(blockId);
    ledgerInclusionState = metadata.ledgerInclusionState;
    return ledgerInclusionState !== undefined;
  }, 120);
  return ledgerInclusionState;
};

export const getResponseBlockMetadata = async (
  blockId: string,
  client: SingleNodeClient
) => {
  console.log("Awaiting response, this might take a minute or two..");
  const block = await client.block(blockId);
  const payloadHash = TransactionHelper.getTransactionPayloadHash(
    block.payload as ITransactionPayload
  );
  const outputId = Converter.bytesToHex(payloadHash, true) + "0000";

  await wait(async () => {
    const output = await client.output(outputId);
    return output.metadata.isSpent;
  });

  const output = await client.output(outputId);
  const transactionId = output.metadata.transactionIdSpent!;
  const spentBlock = await client.transactionIncludedBlock(transactionId);
  const hexData =
    (spentBlock.payload as ITransactionPayload).essence.payload?.data || "";
  return JSON.parse(Converter.hexToUtf8(hexData) || "{}");
};
