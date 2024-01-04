// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Schema<Value = any> {
    /** @category Type Hints */
    readonly _Value!: Value;
}
