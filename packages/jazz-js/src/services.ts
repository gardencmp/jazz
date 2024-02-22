import { Context } from "effect";
import { ControlledAccount } from "./coValues/account/account.js";

export type ControlledAccountCtx = ControlledAccount;

export const ControlledAccountCtx = Context.Tag("jazz/ControlledAccount")<ControlledAccount, ControlledAccount>();