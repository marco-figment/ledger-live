import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Transaction } from "./types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { DeviceTransactionField } from "../../transaction";
import type { AccountLike, TransactionStatus } from "../../types";

export type ExtraDeviceTransactionField =
  | {
      type: "osmosis.delegateValidators";
      label: string;
    }
  | {
      type: "osmosis.validatorName";
      label: string;
    }
  | {
      type: "osmosis.sourceValidatorName";
      label: string;
    }
  | {
      type: "osmosis.extendedAmount";
      label: string;
    };

function getDeviceTransactionConfig({
  account,
  transaction,
  status: { estimatedFees, totalSpent },
}: {
  account: AccountLike;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const { mode, memo, validators } = transaction;
  const currency = getCryptoCurrencyById("osmosis");
  const fields: Array<DeviceTransactionField> = [];

  switch (mode) {
    case "send":
      fields.push({
        type: "osmosis.extendedAmount",
        label: "Amount",
      });
      break;

    case "delegate":
      fields.push({
        type: "text",
        label: "Type",
        value: "Delegate",
      });

      fields.push({
        type: "osmosis.delegateValidators",
        label: "Validators",
      });
      break;

    case "redelegate":
      fields.push({
        type: "text",
        label: "Type",
        value: "Redelegate",
      });

      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(
          getAccountUnit(account),
          validators[0].amount,
          {
            showCode: true,
            disableRounding: true,
          }
        ),
      });

      fields.push({
        type: "osmosis.validatorName",
        label: "Validator Dest",
      });

      fields.push({
        type: "osmosis.sourceValidatorName",
        label: "Validator Source",
      });
      break;

    case "claimReward":
      fields.push({
        type: "text",
        label: "Type",
        value: "Withdraw Reward",
      });
      fields.push({
        type: "osmosis.validatorName",
        label: "Validator",
      });
      break;

    case "claimRewardCompound":
      fields.push({
        type: "text",
        label: "Type",
        value: "Withdraw Reward",
      });
      fields.push({
        type: "osmosis.validatorName",
        label: "Validator",
      });
      fields.push({
        type: "text",
        label: "Type",
        value: "Delegate",
      });
      fields.push({
        type: "osmosis.delegateValidators",
        label: "Validators",
      });
      break;

    default:
      break;
  }

  if (!estimatedFees.isNaN() && estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fee",
    });
  }

  if (memo) {
    fields.push({
      type: "text",
      label: "Memo",
      value: memo,
    });
  }

  fields.push({
    type: "text",
    label: "Total",
    value: formatCurrencyUnit(currency.units[0], totalSpent, {
      showCode: true,
      disableRounding: true,
    }),
  });

  return fields;
}

export default getDeviceTransactionConfig;
