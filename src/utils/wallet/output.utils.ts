import {
  ADDRESS_UNLOCK_CONDITION_TYPE,
  BASIC_OUTPUT_TYPE,
  Bech32Helper,
  IBasicOutput,
  INativeToken,
  INodeInfo,
  METADATA_FEATURE_TYPE,
  TransactionHelper,
  UnlockConditionTypes,
} from "@iota/iota.js";
import { Converter, HexHelper } from "@iota/util.js";
import bigInt from "big-integer";
import { cloneDeep, isEmpty } from "lodash";

export const packBasicOutput = (
  toBech32: string,
  amount: number,
  nativeTokens: INativeToken[] | undefined,
  info: INodeInfo,
  metadata: string
) => {
  const targetAddress = Bech32Helper.addressFromBech32(
    toBech32,
    info.protocol.bech32Hrp
  );
  const unlockConditions: UnlockConditionTypes[] = [
    { type: ADDRESS_UNLOCK_CONDITION_TYPE, address: targetAddress },
  ];
  const output: IBasicOutput = {
    type: BASIC_OUTPUT_TYPE,
    amount: "0",
    nativeTokens: nativeTokens?.map((nt) => ({
      id: nt.id,
      amount: HexHelper.fromBigInt256(bigInt(Number(nt.amount))),
    })),
    unlockConditions,
  };

  if (!isEmpty(metadata)) {
    output.features = [
      {
        type: METADATA_FEATURE_TYPE,
        data: Converter.utf8ToHex(metadata, true),
      },
    ];
  }
  const storageDeposit = TransactionHelper.getStorageDeposit(
    output,
    info.protocol.rentStructure!
  );
  output.amount = bigInt.max(bigInt(amount), storageDeposit).toString();

  return output;
};

export const mergeOutputs = (outputs: IBasicOutput[]) => {
  const addressUnlock = outputs[0].unlockConditions.find(
    (u) => u.type === ADDRESS_UNLOCK_CONDITION_TYPE
  )!;
  const merged: IBasicOutput = {
    type: BASIC_OUTPUT_TYPE,
    amount: "0",
    unlockConditions: [addressUnlock],
  };
  for (const output of outputs) {
    const nativeTokens = merged.nativeTokens || [];
    for (const nativeToken of output.nativeTokens || []) {
      const index = nativeTokens.findIndex((n) => n.id === nativeToken.id);
      if (index === -1) {
        nativeTokens.push(nativeToken);
      } else {
        nativeTokens[index].amount = addHex(
          nativeTokens[index].amount,
          nativeToken.amount
        );
      }
    }
    merged.amount = (Number(output.amount) + Number(merged.amount)).toString();
    merged.nativeTokens = nativeTokens;
  }
  return merged;
};

export const subtractNativeTokens = (
  output: IBasicOutput,
  nativeTokens: INativeToken[] | undefined
) => {
  if (!output.nativeTokens || !nativeTokens) {
    return output.nativeTokens;
  }
  return cloneDeep(output.nativeTokens || [])
    .map((nativeToken) => {
      const tokensToSubtract = nativeTokens.find(
        (t) => t.id === nativeToken.id
      )?.amount;
      if (!tokensToSubtract) {
        return nativeToken;
      }
      return {
        id: nativeToken.id,
        amount: subtractHex(nativeToken.amount, tokensToSubtract),
      };
    })
    .filter((nt) => Number(nt.amount) !== 0);
};

export const subtractHex = (a: string, b: string) =>
  HexHelper.fromBigInt256(
    HexHelper.toBigInt256(a).subtract(HexHelper.toBigInt256(b))
  );

export const addHex = (a: string, b: string) =>
  HexHelper.fromBigInt256(
    HexHelper.toBigInt256(a).add(HexHelper.toBigInt256(b))
  );
