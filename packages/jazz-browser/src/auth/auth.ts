import { Account, CryptoProvider, ID, Peer } from "jazz-tools";
import { SessionProvider } from "../index.js";
import { AgentSecret } from "cojson";

/** @category Auth Providers */
export interface AuthProvider<Acc extends Account> {
    startAuthentication(restartReason?: "accountNotLoaded"): Promise<{accountID: ID<Account>, accountSecret: AgentSecret}>