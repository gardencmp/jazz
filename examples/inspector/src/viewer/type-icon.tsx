import { CoID, LocalNode, RawCoValue } from "cojson";
import {
    CoJsonType,
    ExtendedCoJsonType,
    useResolvedCoValue,
} from "./use-resolve-covalue";

export const TypeIcon = ({
    type,
    extendedType,
}: {
    type: CoJsonType;
    extendedType?: ExtendedCoJsonType;
}) => {
    if (extendedType === "record") {
        return <span className="font-mono">{"{} Record"}</span>;
    }

    if (extendedType === "image") {
        return <span className="font-mono">🖼️ Image</span>;
    }

    if (type === "comap") {
        return <span className="font-mono">{"{} CoMap"}</span>;
    }
    if (type === "costream") {
        return <span className="font-mono">≋ CoStream</span>;
    }
    if (type === "colist") {
        return <span className="font-mono">☰ CoList</span>;
    }
    return "no match";
};

export const ResolveIcon = ({
    coId,
    node,
}: {
    coId: CoID<RawCoValue>;
    node: LocalNode;
}) => {
    const { type, extendedType } = useResolvedCoValue(coId, node);

    if (!type) return null;

    return <TypeIcon type={type} extendedType={extendedType} />;
};
