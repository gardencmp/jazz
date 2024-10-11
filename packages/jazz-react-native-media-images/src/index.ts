import { Image } from "react-native";
import { Account, BinaryCoStream, Group, ImageDefinition } from "jazz-tools";
import * as FileSystem from "expo-file-system";
import ImageResizer from "@bam.tech/react-native-image-resizer";

function arrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as ArrayBuffer);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(blob);
    });
}

async function fileUriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    const blob = await response.blob();
    blob.arrayBuffer = () => arrayBuffer(blob);
    return blob;
}

async function convertFileContentsToBase64DataURI(
    fileUri: string,
    contentType: string,
) {
    try {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error("Failed to convert file to base64:", error);
        return null;
    }
}

function base64DataURIToParts(base64Data: string) {
    const parts = base64Data.split(",");
    const contentType = parts[0]?.split(":")?.[1]?.split(";")?.[0] || "";
    const data = parts[1] || "";
    return { contentType, data };
}

function contentTypeToFormat(contentType: string) {
    if (contentType.includes("image/png")) return "PNG";
    if (contentType.includes("image/jpeg")) return "JPEG";
    if (contentType.includes("image/webp")) return "WEBP";
    return "PNG";
}

async function base64DataURIToBlob(base64Data: string) {
    const { contentType, data } = base64DataURIToParts(base64Data);
    const byteCharacters = atob(data);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const buffer = Buffer.from(byteArray);
    // @ts-expect-error buffer has data
    const blob = new Blob([buffer.data], { type: contentType });
    blob.arrayBuffer = () => arrayBuffer(blob);
    return blob;
}

async function getImageDimensions(
    uri: string,
): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        Image.getSize(
            uri,
            (width, height) => resolve({ width, height }),
            (error) => reject(error),
        );
    });
}

/** @category Image creation */
export async function createImage(
    base64ImageDataURI: string,
    options: {
        owner: Group | Account;
        maxSize?: 256 | 1024 | 2048;
    },
): Promise<ImageDefinition> {
    const { contentType } = base64DataURIToParts(base64ImageDataURI);
    const format = contentTypeToFormat(contentType);

    const { width: originalWidth, height: originalHeight } =
        await getImageDimensions(base64ImageDataURI);

    const placeholderImage = await ImageResizer.createResizedImage(
        base64ImageDataURI,
        8,
        8,
        format,
        100,
        0,
    );

    const placeholderDataURL = await convertFileContentsToBase64DataURI(
        placeholderImage.uri,
        contentType,
    );

    const imageDefinition = ImageDefinition.create(
        {
            originalSize: [originalWidth, originalHeight],
            placeholderDataURL,
        },
        { owner: options.owner },
    );

    const addImageStream = async (
        width: number,
        height: number,
        label: string,
    ) => {
        const resizedImage = await ImageResizer.createResizedImage(
            base64ImageDataURI,
            width,
            height,
            format,
            80,
            0,
        );

        const binaryStream = await BinaryCoStream.createFromBlob(
            await fileUriToBlob(resizedImage.uri),
            { owner: options.owner },
        );

        // @ts-expect-error types
        imageDefinition[label] = binaryStream;
    };

    if (originalWidth > 256 || originalHeight > 256) {
        const width =
            originalWidth > originalHeight
                ? 256
                : Math.round(256 * (originalWidth / originalHeight));
        const height =
            originalHeight > originalWidth
                ? 256
                : Math.round(256 * (originalHeight / originalWidth));
        await addImageStream(width, height, `${width}x${height}`);
    }

    if (options.maxSize === 256) return imageDefinition;

    if (originalWidth > 1024 || originalHeight > 1024) {
        const width =
            originalWidth > originalHeight
                ? 1024
                : Math.round(1024 * (originalWidth / originalHeight));
        const height =
            originalHeight > originalWidth
                ? 1024
                : Math.round(1024 * (originalHeight / originalWidth));
        await addImageStream(width, height, `${width}x${height}`);
    }

    if (options.maxSize === 1024) return imageDefinition;

    if (originalWidth > 2048 || originalHeight > 2048) {
        const width =
            originalWidth > originalHeight
                ? 2048
                : Math.round(2048 * (originalWidth / originalHeight));
        const height =
            originalHeight > originalWidth
                ? 2048
                : Math.round(2048 * (originalHeight / originalWidth));
        await addImageStream(width, height, `${width}x${height}`);
    }

    if (options.maxSize === 2048) return imageDefinition;

    const originalBinaryStream = await BinaryCoStream.createFromBlob(
        await base64DataURIToBlob(base64ImageDataURI),
        { owner: options.owner },
    );
    imageDefinition[`${originalWidth}x${originalHeight}`] =
        originalBinaryStream;

    return imageDefinition;
}
