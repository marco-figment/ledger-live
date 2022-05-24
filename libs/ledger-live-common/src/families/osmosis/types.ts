import type { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
import { CosmosDelegationInfo, CosmosDelegationInfoRaw } from "../cosmos/types";

export type Transaction = TransactionCommon & {
  family: "osmosis";
  mode: string;
  fees: BigNumber | null;
  gas: BigNumber | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfo[];
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "osmosis";
  mode: string;
  fees: string | null;
  gas: string | null | undefined;
  memo: string | null | undefined;
  validators: CosmosDelegationInfoRaw[];
};

export type StatusErrorMap = {
  recipient?: Error;
  amount?: Error;
  fees?: Error;
  validators?: Error;
  delegate?: Error;
  redelegation?: Error;
  unbonding?: Error;
  claimReward?: Error;
  feeTooHigh?: Error;
};

export type TransactionStatus = {
  errors: StatusErrorMap;
  warnings: StatusErrorMap;
  estimatedFees: BigNumber;
  amount: BigNumber;
  totalSpent: BigNumber;
};
