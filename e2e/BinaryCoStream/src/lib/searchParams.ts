import { ID } from "jazz-tools";
import { UploadedFile } from "../schema";

export function getValueId() {
    return new URLSearchParams(location.search).get("valueId") as ID<UploadedFile> | undefined ?? undefined;
}

export function getIsAutoUpload() {
    return new URLSearchParams(location.search).has("auto");
}

export function getDefaultFileSize() {
    return parseInt(new URLSearchParams(location.search).get("fileSize") ?? 1e5.toString());
}