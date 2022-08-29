/* @flow */
import { BigNumber } from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import React, { useCallback, useState, useEffect, ReactNode } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Switch,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import {
  formatCurrencyUnit,
  getCurrencyColor,
} from "@ledgerhq/live-common/currencies/index";
import Button from "../../../components/Button";
import KeyboardView from "../../../components/KeyboardView";
import Touchable from "../../../components/Touchable";
import CurrencyInput from "../../../components/CurrencyInput";
import TranslatedError from "../../../components/TranslatedError";
import SendRowsFee from "../SendRowsFee";
import { getFirstStatusError } from "../../helpers";
import { useDebounce } from "@ledgerhq/live-common/lib/hooks/useDebounce";
import { Box, rgba, Text } from "@ledgerhq/native-ui";
import { CeloAccount } from "@ledgerhq/live-common/lib/families/celo/types";
import CheckBox from "../../../components/CheckBox";
import Circle from "../../../components/Circle"
import BulletList from "../../../components/BulletList";
import Section from "../../../screens/OperationDetails/Section";
import CounterValue from "../../../components/CounterValue";
import Clock from "../../../icons/Clock";
import { SummaryWords } from "../VoteFlow/02-Summary";
import Icon from "react-native-vector-icons/dist/Feather";
import LText from "../../../components/LText";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  amount?: number,
};

export default function WithdrawAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  
  const bridge = getAccountBridge(account, parentAccount);
  const mainAccount = getMainAccount(account, parentAccount);

  const [selected, setSelected] = useState(-1);

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
  } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);
    const transaction = bridge.updateTransaction(t, {
      mode: "withdraw",
    });
    return { account: mainAccount, transaction };
  });

  const debouncedTransaction = useDebounce(transaction, 500);
  

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "celo", "not a celo transaction");
  
  useEffect(() => {
    if (!account) return;
    
    let cancelled = false;
    bridge
    .prepareTransaction(account as CeloAccount, debouncedTransaction)
    .then(res => {
      if (cancelled) return;
      console.log('res: ', res)
    })
  }, [account, parentAccount, transaction]);

  const onChange = useCallback(index => {
      if (index != null) {
        setSelected(index)
        setTransaction(bridge.updateTransaction(transaction, { index: selected }));
      }
    },
    [setTransaction, transaction, bridge],    
  );

  const onContinue = () => {
    navigation.navigate(ScreenName.CeloWithdrawSelectDevice, {
      ...route.params,
      amount: status.amount,
    });
  };

  const blur = useCallback(() => Keyboard.dismiss(), []);

  if (!account || !transaction) return null;
  // const { pendingWithdrawals } = (account as CeloAccount).celoResources;
  const pendingWithdrawals = [
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
  ];
  // if ((transaction.index === null || transaction.index === undefined) && pendingWithdrawals[0])
  // onChange(pendingWithdrawals[0].index);

  const timeFromNow = time => {
    var unixTime = new Date(time).getTime();
    if (!unixTime) return;
    var now = new Date().getTime();
    const difference = (unixTime / 1000) - (now / 1000);
    return difference;
  };
  
  const { amount } = status;
  const unit = getAccountUnit(account);
  const formattedAmount  = formatCurrencyUnit(unit, new BigNumber(amount), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  });

  const formatAmount = (val) => {
    return formatCurrencyUnit(unit, new BigNumber(val), {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    });
  }
  const currency = getAccountCurrency(account);
  const error =
    amount.eq(0) || bridgePending
      ? null
      : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");

  return (
    <>
      <TrackScreen category="WithdrawFlow" name="Amount" />
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >

        <View style={styles.summary}>
        <>
          <Line>
              <Words>
                <Trans i18nKey={`celo.withdraw.iWithdraw`} />
              </Words>
              
            {(pendingWithdrawals != null && pendingWithdrawals.length > 0)
              ? (pendingWithdrawals.map(({value, time, index}) => {
                const withdrawalTime = new Date(time.toNumber() * 1000);
                const disabled = withdrawalTime > new Date();
                return (
                  selected === index ? (
                    <Selectable selected={true} name={formatAmount(value)} />
                   ) : (
                    <Touchable onPress={() => onChange(index)}>
                      <Selectable selected={false} name={formatAmount(value)} />
                    </Touchable>
                   )
                )
            })) : null }
            </Line>
          </>
          <View style={styles.bottomWrapper}>
          <SendRowsFee
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
          />
          <View style={styles.continueWrapper}>
            <Button
              event="CeloWithdrawAmountContinue"
              type="primary"
              title={
                <Trans
                  i18nKey={
                    !bridgePending
                      ? "common.continue"
                      : "send.amount.loadingNetwork"
                  }
                />
              }
              onPress={onContinue}
              disabled={!!status.errors.amount || bridgePending}
            />
          </View>
        </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const Line = ({ children }: { children: ReactNode }) => (
  <View style={styles.summaryLine}>{children}</View>
);

const Words = ({
  children,
  highlighted,
  style,
}: {
  children: ReactNode;
  highlighted?: boolean;
  style?: any;
}) => (
  <Text
    numberOfLines={1}
    fontWeight={highlighted ? "bold" : "semiBold"}
    style={[styles.summaryWords, style]}
    color={highlighted ? "live" : "smoke"}
  >
    {children}
  </Text>
);


const Selectable = ({
  name,
  selected,
  readOnly,
}: {
  name: string;
  selected: boolean;
  readOnly?: boolean;
}) => {
  const { colors } = useTheme();
  const color = selected ? colors.primary : colors.grey;
  return (
    <View
      style={[
        styles.validatorSelection,
        { backgroundColor: rgba(color, 0.2) },
      ]}
    >
      <Text
        fontWeight="bold"
        numberOfLines={1}
        style={styles.validatorSelectionText}
        color={color}
      >
        {name}
      </Text>

      <View
        style={[
          styles.validatorSelectionIcon,
          { backgroundColor: color },
        ]}
      >
        {/* <Icon size={16} name="edit-2" color={colors.text} /> */}
        { !!selected && <Icon size={16} name="check" color={colors.white} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  summary: {
    alignItems: "center",
    marginVertical: 30,
  },
  available: {
    flexDirection: "row",
    display: "flex",
    flexGrow: 1,
  },
  availableRight: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  availableLeft: {
    justifyContent: "center",
    flexGrow: 1,
  },
  maxLabel: {
    marginRight: 4,
  },
  bottomWrapper: {
    flexGrow: 0,
    alignItems: "stretch",
    justifyContent: "flex-end",
    flexShrink: 1,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  validatorSelection: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    height: 40,
  },
  validatorSelectionText: {
    paddingHorizontal: 8,
    fontSize: 18,
    maxWidth: 240,
  },
  validatorSelectionIcon: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 40,
  },
  wrapper: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flexBasis: 75,
  },
  inputStyle: {
    flex: 0,
    flexShrink: 1,
    textAlign: "center",
  },
  currency: {
    fontSize: 32,
  },
  fieldStatus: {
    fontSize: 14,
    textAlign: "center",
  },
  switch: {
    opacity: 0.99,
  },
  summaryWords: {
    marginRight: 6,
    fontSize: 18,
  },
  bulletItem: {
    fontSize: 14,
  },
});
