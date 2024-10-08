import { createJazzRNApp } from "jazz-react-native";
import { MMKVStorage } from "./mmkv-storage";

const nativeStorage = new MMKVStorage();

export const Jazz = createJazzRNApp({ nativeStorage });
export const { useAccount, useCoState, useAcceptInvite } = Jazz;
