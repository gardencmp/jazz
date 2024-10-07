import { createJazzRNApp } from "jazz-react-native";
import { MMKVStorage } from "./mmkv-storage";
import { Account } from "jazz-tools";
import { UserAccount, UserAccountRoot } from "./schema";

const nativeStorage = new MMKVStorage();

export const Jazz = createJazzRNApp<UserAccount>({ nativeStorage });
export const { useAccount, useCoState, useAcceptInvite } = Jazz;
