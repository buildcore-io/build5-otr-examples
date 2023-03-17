import { Bip32Path } from '@iota/crypto.js';
import {
  addressBalance,
  BASIC_OUTPUT_TYPE,
  Bech32Helper,
  Ed25519Address,
  Ed25519Seed,
  ED25519_ADDRESS_TYPE,
  IBasicOutput,
  IKeyPair,
  INativeToken,
  IndexerPluginClient,
  INodeInfo,
  REFERENCE_UNLOCK_TYPE,
  SingleNodeClient,
  TransactionHelper,
  UnlockTypes,
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
}

export const getNewWallet = async () => {
  const client = new SingleNodeClient(config.smr_endpoint_url);
  const healty = await client.health();
  if (healty) {
    return new SmrWallet(client, await client.info());
  }
  throw Error('Could not connect to smr node');
};
