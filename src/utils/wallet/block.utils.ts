import { Ed25519 } from '@iota/crypto.js';
import {
  DEFAULT_PROTOCOL_VERSION,
  ED25519_SIGNATURE_TYPE,
  IBlock,
  IKeyPair,
  ISignatureUnlock,
  ITransactionEssence,
  ITransactionPayload,
  IUTXOInput,
  MAX_BLOCK_LENGTH,
  OutputTypes,
  SIGNATURE_UNLOCK_TYPE,
  SingleNodeClient,
  TAGGED_DATA_PAYLOAD_TYPE,
  TRANSACTION_ESSENCE_TYPE,
  TRANSACTION_PAYLOAD_TYPE,
  TransactionHelper,
  UnlockTypes,
  serializeBlock,
} from '@iota/iota.js';
import { WasmPowProvider } from '@iota/pow-wasm.js';
import { Converter, WriteStream } from '@iota/util.js';
import { KEY_NAME_TANGLE } from '@soonaverse/interfaces';
import { wait } from '../wait';
import { SmrWallet } from './Wallet';

export const packEssence = (
  inputs: IUTXOInput[],
  inputsCommitment: string,
  outputs: OutputTypes[],
  wallet: SmrWallet,
) =>
  <ITransactionEssence>{
    type: TRANSACTION_ESSENCE_TYPE,
    networkId: TransactionHelper.networkIdFromNetworkName(wallet.info.protocol.networkName),
    inputs,
    outputs,
    inputsCommitment,
    payload: {
      type: TAGGED_DATA_PAYLOAD_TYPE,
      tag: Converter.utf8ToHex(KEY_NAME_TANGLE, true),
    },
  };

export const createUnlock = (essence: ITransactionEssence, keyPair: IKeyPair): ISignatureUnlock => {
  const essenceHash = TransactionHelper.getTransactionEssenceHash(essence);
  return {
    type: SIGNATURE_UNLOCK_TYPE,
    signature: {
      type: ED25519_SIGNATURE_TYPE,
      publicKey: Converter.bytesToHex(keyPair.publicKey, true),
      signature: Converter.bytesToHex(Ed25519.sign(keyPair.privateKey, essenceHash), true),
    },
  };
};

export const submitBlock = async (
  wallet: SmrWallet,
  payload: ITransactionPayload,
): Promise<string> => {
  const block: IBlock = {
    protocolVersion: DEFAULT_PROTOCOL_VERSION,
    parents: (await wallet.client.tips()).tips,
    payload,
    nonce: '0',
  };
  block.nonce = await caluclateNonce(block, wallet.info.protocol.minPowScore);
  return await wallet.client.blockSubmit(block);
};

async function caluclateNonce(block: IBlock, minPowScore: number): Promise<string> {
  const writeStream = new WriteStream();
  serializeBlock(writeStream, block);
  const blockBytes = writeStream.finalBytes();

  if (blockBytes.length > MAX_BLOCK_LENGTH) {
    throw new Error(
      `The block length is ${blockBytes.length}, which exceeds the maximum size of ${MAX_BLOCK_LENGTH}`,
    );
  }

  const powProvider = new WasmPowProvider();
  const nonce = await powProvider.pow(blockBytes, minPowScore);
  return nonce.toString();
}

export const packPayload = (essence: ITransactionEssence, unlocks: UnlockTypes[]) =>
  <ITransactionPayload>{ type: TRANSACTION_PAYLOAD_TYPE, essence, unlocks };

export const getLedgerInclusionState = async (blockId: string, client: SingleNodeClient) => {
  let ledgerInclusionState: string | undefined = undefined;
  await wait(async () => {
    const metadata = await client.blockMetadata(blockId);
    ledgerInclusionState = metadata.ledgerInclusionState;
    return ledgerInclusionState !== undefined;
  }, 120);
  return ledgerInclusionState;
};

export const getResponseBlockMetadata = async (blockId: string, client: SingleNodeClient) => {
  console.log('Awaiting response, this might take a minute or two...');
  const block = await client.block(blockId);
  const payloadHash = TransactionHelper.getTransactionPayloadHash(
    block.payload as ITransactionPayload,
  );
  const outputId = Converter.bytesToHex(payloadHash, true) + '0000';

  await wait(async () => {
    const output = await client.output(outputId);
    return output.metadata.isSpent;
  });

  const output = await client.output(outputId);
  const transactionId = output.metadata.transactionIdSpent!;
  const spentBlock = await client.transactionIncludedBlock(transactionId);
  const hexData = (spentBlock.payload as ITransactionPayload).essence.payload?.data || '';
  return JSON.parse(Converter.hexToUtf8(hexData) || '{}');
};
