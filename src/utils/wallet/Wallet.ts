import { Bip32Path } from '@iota/crypto.js';
import {
  ADDRESS_UNLOCK_CONDITION_TYPE,
  BASIC_OUTPUT_TYPE,
  Bech32Helper,
  ED25519_ADDRESS_TYPE,
  Ed25519Address,
  Ed25519Seed,
  IBasicOutput,
  IKeyPair,
  INativeToken,
  INftOutput,
  INodeInfo,
  IndexerPluginClient,
  REFERENCE_UNLOCK_TYPE,
  SingleNodeClient,
  TransactionHelper,
  UnlockTypes,
  addressBalance,
} from '@iota/iota.js';
import { Converter } from '@iota/util.js';
import { generateMnemonic } from 'bip39';
import { cloneDeep } from 'lodash';
import config from '../../config.json';
import {
  createUnlock,
  getLedgerInclusionState,
  packEssence,
  packPayload,
  submitBlock,
} from './block.utils';
import { mergeOutputs, packBasicOutput, subtractNativeTokens } from './output.utils';

export const EMPTY_NFT_ID = '0x0000000000000000000000000000000000000000000000000000000000000000';

export interface AddressDetails {
  bech32: string;
  keyPair: IKeyPair;
  hex: string;
  mnemonic: string;
}

export class SmrWallet {
  constructor(public readonly client: SingleNodeClient, public readonly info: INodeInfo) {}

  public getBalance = async (addressBech32: string) => {
    const balance = await addressBalance(this.client, addressBech32);
    return Number(balance.balance);
  };

  public getNewIotaAddressDetails = () =>
    this.getIotaAddressDetails(generateMnemonic() + ' ' + generateMnemonic());

  public getIotaAddressDetails = async (mnemonic: string) => {
    const walletSeed = Ed25519Seed.fromMnemonic(mnemonic);
    const walletPath = new Bip32Path("m/44'/4218'/0'/0'/0'");
    const walletAddressSeed = walletSeed.generateSeedFromPath(walletPath);
    const keyPair = walletAddressSeed.keyPair();
    const walletEd25519Address = new Ed25519Address(keyPair.publicKey);
    const walletAddress = walletEd25519Address.toAddress();
    const hex = Converter.bytesToHex(walletAddress, true);
    const bech32 = Bech32Helper.toBech32(
      ED25519_ADDRESS_TYPE,
      walletAddress,
      this.info.protocol.bech32Hrp,
    );
    return <AddressDetails>{ mnemonic, keyPair, hex, bech32 };
  };

  public getOutputs = async (addressBech32: string) => {
    const indexer = new IndexerPluginClient(this.client);
    const query = {
      addressBech32,
      hasStorageDepositReturn: false,
      hasTimelock: false,
    };
    const outputIds = (await indexer.basicOutputs(query)).items;
    const outputs: { [key: string]: IBasicOutput } = {};
    for (const id of outputIds) {
      const output = (await this.client.output(id)).output;
      if (output.type === BASIC_OUTPUT_TYPE) {
        outputs[id] = output;
      }
    }
    return outputs;
  };

  public send = async (
    from: AddressDetails,
    toBech32: string,
    amount: number,
    nativeTokens: INativeToken[] | undefined,
    metadata: string,
  ) => {
    const outputsMap = await this.getOutputs(from.bech32);
    const output = packBasicOutput(toBech32, amount, nativeTokens, this.info, metadata);
    if (Object.keys(outputsMap).length === 0) {
      throw Error('No outputs to process. Most likely not balance in the wallet.');
    }

    const remainder = mergeOutputs(cloneDeep(Object.values(outputsMap)));
    remainder.nativeTokens = subtractNativeTokens(remainder, nativeTokens);
    remainder.amount = (Number(remainder.amount) - Number(output.amount)).toString();

    const inputs = Object.keys(outputsMap).map(TransactionHelper.inputFromOutputId);
    const inputsCommitment = TransactionHelper.getInputsCommitment(Object.values(outputsMap));

    const essence = packEssence(
      inputs,
      inputsCommitment,
      Number(remainder.amount) > 0 ? [output, remainder] : [output],
      this,
    );
    const unlocks: UnlockTypes[] = Object.values(outputsMap).map((_, index) =>
      !index ? createUnlock(essence, from.keyPair) : { type: REFERENCE_UNLOCK_TYPE, reference: 0 },
    );

    console.log('Calculating PoW and sending block');
    const blockId = await submitBlock(this, packPayload(essence, unlocks));

    console.log('Request sent, blockId', blockId);
    console.log('Awaiting block inclusion.');

    const ledgerInclusionState = await getLedgerInclusionState(blockId, this.client);
    if (ledgerInclusionState !== 'included') {
      throw Error(`Invalid ledger inclusion state: ${ledgerInclusionState}`);
    }
    return blockId;
  };

  public sendNft = async (sourceAddress: AddressDetails, targetAddess: string, nftId?: string) => {
    const consumedOutputs = await this.getNftOutput(sourceAddress, nftId);
    const [consumedNftOutputId, consumedNftOutput] = Object.entries(consumedOutputs)[0];

    const nftOutput = cloneDeep(consumedNftOutput);
    const targetAddress = Bech32Helper.addressFromBech32(
      targetAddess,
      this.info.protocol.bech32Hrp,
    );
    nftOutput.unlockConditions = [{ type: ADDRESS_UNLOCK_CONDITION_TYPE, address: targetAddress }];
    if (nftOutput.nftId === EMPTY_NFT_ID) {
      nftOutput.nftId = TransactionHelper.resolveIdFromOutputId(consumedNftOutputId);
    }

    const inputs = [consumedNftOutputId].map(TransactionHelper.inputFromOutputId);
    const inputsCommitment = TransactionHelper.getInputsCommitment([consumedNftOutput]);
    const essence = packEssence(inputs, inputsCommitment, [nftOutput], this);
    const payload = packPayload(essence, [createUnlock(essence, sourceAddress.keyPair)]);

    return await submitBlock(this, payload);
  };

  private getNftOutput = async (address: AddressDetails, nftId?: string) => {
    const indexer = new IndexerPluginClient(this.client);
    if (nftId) {
      const items = (await indexer.nft(nftId)).items;
      const output = (await this.client.output(items[0])).output;
      return { [items[0]]: output as INftOutput };
    }

    const items = (await indexer.nfts({ addressBech32: address.bech32 })).items;
    const result: { [key: string]: INftOutput } = {};
    for (const item of items) {
      result[item] = (await this.client.output(item)).output as INftOutput;
    }
    return result;
  };
}

export const getNewWallet = async () => {
  const client = new SingleNodeClient(config.smr_endpoint_url);
  const healty = await client.health();
  if (healty) {
    return new SmrWallet(client, await client.info());
  }
  throw Error('Could not connect to smr node');
};
