import { Context } from "effect";
import { ControlledAccount } from ".";

export type ControlledAccountCtx = ControlledAccount;

export const ControlledAccountCtx = Context.Tag<ControlledAccount>("jazz/ControlledAccount");