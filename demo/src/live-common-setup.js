// @flow
import { Observable } from "rxjs";
import { implementCountervalues } from "@ledgerhq/live-common/lib/countervalues";
import { map } from "rxjs/operators";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
import axios from "axios";
import { setNetwork } from "@ledgerhq/live-common/lib/network";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { setEnv } from "@ledgerhq/live-common/lib/env";

import "@ledgerhq/live-common/lib/load/tokens/ethereum/erc20";

import { pairsSelector } from "./reducers/markets";
import { setExchangePairsAction } from "./actions/markets";

setEnv("FORCE_PROVIDER", 4);

setNetwork(axios);

const webusbDevices = {};

// Still a big WIP. not sure how this should work in web paradigm...
// 'discover' is not practical paradigm, needs to fit the requestDevice paradigm!

registerTransportModule({
  id: "webusb",

  // $FlowFixMe
  open: (id: string): ?Promise<*> => {
    if (id.startsWith("webusb")) {
      const existingDevice = webusbDevices[id];
      return existingDevice
        ? TransportWebUSB.open(existingDevice)
        : TransportWebUSB.create();
    }
    return null;
  },

  disconnect: id =>
    id.startsWith("webusb")
      ? Promise.resolve() // nothing to do
      : null,

  discovery: Observable.create(TransportWebUSB.listen).pipe(
    map(usbDevice => {
      const id = "webusb|" + usbDevice.vendorId + "_" + usbDevice.productId;
      webusbDevices[id] = usbDevice;
      return {
        type: "add",
        id,
        name: usbDevice.productName
      };
    })
  )
});

const webbleDevices = {};

registerTransportModule({
  id: "webble",

  // $FlowFixMe
  open: (id: string): ?Promise<*> => {
    if (id.startsWith("webble")) {
      const existingDevice = webbleDevices[id];
      return existingDevice
        ? TransportWebBLE.open(existingDevice)
        : TransportWebBLE.create();
    }
    return null;
  },

  disconnect: id =>
    id.startsWith("webble")
      ? Promise.resolve() // nothing to do
      : null,

  discovery: Observable.create(TransportWebUSB.listen).pipe(
    map(bleDevice => {
      const id = "webble|" + bleDevice.id;
      webbleDevices[id] = bleDevice;
      return {
        type: "add",
        id,
        name: bleDevice.name
      };
    })
  )
});

// provide a basic mecanism to stop polling when you leave the tab
// & immediately poll when you come back.
const addExtraPollingHooks = (schedulePoll, cancelPoll) => {
  function onWindowBlur() {
    cancelPoll();
  }
  function onWindowFocus() {
    schedulePoll(1000);
  }
  window.addEventListener("blur", onWindowBlur);
  window.addEventListener("focus", onWindowFocus);
  return () => {
    window.removeEventListener("blur", onWindowBlur);
    window.removeEventListener("focus", onWindowFocus);
  };
};

implementCountervalues({
  network: axios,
  log: (...args) => console.log(...args), // eslint-disable-line no-console
  getAPIBaseURL: () => window.LEDGER_CV_API,
  storeSelector: state => state.countervalues,
  pairsSelector,
  setExchangePairsAction,
  addExtraPollingHooks,
  maximumDays: 1 // we don't actually need history
});
