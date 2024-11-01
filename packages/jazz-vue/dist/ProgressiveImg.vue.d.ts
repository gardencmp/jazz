import { ImageDefinition } from 'jazz-tools';
declare function __VLS_template(): {
    slots: {
        default?(_: {
            src: string | undefined;
            res: `${number}x${number}` | "placeholder" | undefined;
            originalSize: readonly [number, number] | undefined;
        }): any;
    };
    refs: {};
    attrs: Partial<{}>;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<{
    image: ImageDefinition | null | undefined;
    maxWidth?: number;
}, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<{
    image: ImageDefinition | null | undefined;
    maxWidth?: number;
}> & Readonly<{}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
