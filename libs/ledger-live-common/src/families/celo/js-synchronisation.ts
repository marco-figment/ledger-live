import BigNumber from "bignumber.js";
import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { getAccountDetails } from "./api";
import { celoKit } from "./api/sdk";
import {
  getAccountRegistrationStatus,
  getPendingWithdrawals,
  getVotes,
} from "./api/sdk";

const kit = celoKit();

const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency, initialAccount, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];
  const election = await kit.contracts.getElection();
  const lockedGold = await kit.contracts.getLockedGold();

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const {
    blockHeight,
    balance,
    spendableBalance,
    operations: newOperations,
    lockedBalance,
    nonvotingLockedBalance,
  } = await getAccountDetails(address, accountId);

  const accountRegistrationStatus = await getAccountRegistrationStatus(address);

  // const pendingWithdrawals = accountRegistrationStatus
  //   ? await getPendingWithdrawals(address)
  //   : [];
  const pendingWithdrawals = [
    [
      {
        value: new BigNumber("11000000000000000"),
        time: new BigNumber("1661187183"),
        index: 0,
      },
      {
        value: new BigNumber("1000000000000000"),
        time: new BigNumber("1661439326"),
        index: 1,
      },
    ],
  ];

  const votes = accountRegistrationStatus ? await getVotes(address) : [];

  const operations = mergeOps(oldOperations, newOperations);
  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    celoResources: {
      registrationStatus: accountRegistrationStatus,
      lockedBalance,
      nonvotingLockedBalance,
      pendingWithdrawals,
      votes,
      electionAddress: election.address,
      lockedGoldAddress: lockedGold.address,
    },
  };
  return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
