import { CoID, Group, LocalNode, Media } from "cojson";

import ImageBlobReduce from "image-blob-reduce";
import Pica from "pica";
import {
    createBinaryStreamFromBlob,
    readBlobFromBinaryStream,
} from "jazz-browser";

const pica = new Pica();

export async function createImage(
    image: Blob | File,
    inGroup: Group
): Promise<Media.ImageDefinition> {
    let originalWidth!: number;
    let originalHeight!: number;
    const Reducer = new ImageBlobReduce({ pica });
    Reducer.after("_blob_to_image", (env) => {
        originalWidth =
            (env as unknown as { orientation: number }).orientation & 4
                ? env.image.height
                : env.image.width;
        originalHeight =
            (env as unknown as { orientation: number }).orientation & 4
                ? env.image.width
                : env.image.height;
        return Promise.resolve(env);
    });

    const placeholderDataURL = (
        await Reducer.toCanvas(image, { max: 8 })
    ).toDataURL("image/png");

    let imageDefinition = inGroup.createMap<Media.ImageDefinition>();

    imageDefinition = imageDefinition.edit((imageDefinition) => {
        imageDefinition.set("originalSize", [originalWidth, originalHeight]);
        imageDefinition.set("placeholderDataURL", placeholderDataURL);
    });

    setTimeout(async () => {
        const max256 = await Reducer.toBlob(image, { max: 256 });

        if (originalWidth > 256 || originalHeight > 256) {
            const width =
                originalWidth > originalHeight
                    ? 256
                    : Math.round(256 * (originalWidth / originalHeight));
            const height =
                originalHeight > originalWidth
                    ? 256
                    : Math.round(256 * (originalHeight / originalWidth));

            const binaryStreamId = (
                await createBinaryStreamFromBlob(max256, inGroup)
            ).id;

            imageDefinition.edit((imageDefinition) => {
                imageDefinition.set(`${width}x${height}`, binaryStreamId);
            });
        }

        await new Promise((resolve) => setTimeout(resolve, 0));

        const max1024 = await Reducer.toBlob(image, { max: 1024 });

        if (originalWidth > 1024 || originalHeight > 1024) {
            const width =
                originalWidth > originalHeight
                    ? 1024
                    : Math.round(1024 * (originalWidth / originalHeight));
            const height =
                originalHeight > originalWidth
                    ? 1024
                    : Math.round(1024 * (originalHeight / originalWidth));

            const binaryStreamId = (
                await createBinaryStreamFromBlob(max1024, inGroup)
            ).id;

            imageDefinition.edit((imageDefinition) => {
                imageDefinition.set(`${width}x${height}`, binaryStreamId);
            });
        }

        await new Promise((resolve) => setTimeout(resolve, 0));

        const max2048 = await Reducer.toBlob(image, { max: 2048 });

        if (originalWidth > 2048 || originalHeight > 2048) {
            const width =
                originalWidth > originalHeight
                    ? 2048
                    : Math.round(2048 * (originalWidth / originalHeight));
            const height =
                originalHeight > originalWidth
                    ? 2048
                    : Math.round(2048 * (originalHeight / originalWidth));

            const binaryStreamId = (
                await createBinaryStreamFromBlob(max2048, inGroup)
            ).id;

            imageDefinition.edit((imageDefinition) => {
                imageDefinition.set(`${width}x${height}`, binaryStreamId);
            });
        }

        await new Promise((resolve) => setTimeout(resolve, 0));

        const originalBinaryStreamId = (
            await createBinaryStreamFromBlob(image, inGroup)
        ).id;

        imageDefinition.edit((imageDefinition) => {
            imageDefinition.set(
                `${originalWidth}x${originalHeight}`,
                originalBinaryStreamId
            );
        });
    }, 0);

    return imageDefinition;
}

export type LoadingImageInfo = {
    originalSize?: [number, number];
    placeholderDataURL?: string;
    highestResSrc?: string;
};

export function loadImage(
    imageID: CoID<Media.ImageDefinition>,
    localNode: LocalNode,
    progressiveCallback: (update: LoadingImageInfo) => void
): () => void {
    let unsubscribe: (() => void) | undefined;
    let stopped = false;

    const resState: {
        [res: `${number}x${number}`]:
            | { state: "queued" }
            | { state: "loading" }
            | { state: "loaded"; blobURL: string }
            | { state: "revoked" }
            | { state: "failed" }
            | undefined;
    } = {};

    const cleanUp = () => {
        stopped = true;
        for (const [res, entry] of Object.entries(resState)) {
            if (entry?.state === "loaded") {
                URL.revokeObjectURL(entry.blobURL);
                resState[res as `${number}x${number}`] = { state: "revoked" };
            }
        }
        unsubscribe?.();
    };

    localNode
        .load(imageID)
        .then((imageDefinition) => {
            if (stopped) return;
            unsubscribe = imageDefinition.subscribe(async (imageDefinition) => {
                if (stopped) return;

                const originalSize = imageDefinition.get("originalSize");
                const placeholderDataURL =
                    imageDefinition.get("placeholderDataURL");

                const resolutions = imageDefinition.keys()
                    .filter(
                        (key): key is `${number}x${number}` =>
                            !!key.match(/\d+x\d+/)
                    )
                    .sort((a, b) => {
                        const widthA = Number(a.split("x")[0]);
                        const widthB = Number(b.split("x")[0]);
                        return widthA - widthB;
                    });

                const startLoading = async () => {

                    const notYetQueuedOrLoading = resolutions.filter(
                        (res) => !resState[res]
                        );

                    console.log("Loading iteration", resolutions, resState, notYetQueuedOrLoading);

                    for (const res of notYetQueuedOrLoading) {
                            resState[res] = { state: "queued" };
                    }

                    for (const res of notYetQueuedOrLoading) {
                        if (stopped) return;
                        resState[res] = { state: "loading" };

                        const binaryStreamId = imageDefinition.get(res)!;
                        console.log("Loading image res", imageID, res, binaryStreamId);

                        const blob = await readBlobFromBinaryStream(
                            binaryStreamId,
                            localNode
                        );

                        if (stopped) return;
                        if (!blob) {
                            resState[res] = { state: "failed" };
                            console.log("Loading image res failed", imageID, res, binaryStreamId);
                            continue;
                        }

                        const blobURL = URL.createObjectURL(blob);
                        resState[res] = { state: "loaded", blobURL };

                        console.log("Loaded image res", imageID, res, binaryStreamId);

                        progressiveCallback({
                            originalSize,
                            placeholderDataURL,
                            highestResSrc: blobURL,
                        });

                        await new Promise((resolve) => setTimeout(resolve, 0));
                    }
                };

                if (
                    !Object.values(resState).some(
                        (entry) => entry?.state === "loaded"
                    )
                ) {
                    progressiveCallback({
                        originalSize,
                        placeholderDataURL,
                    });
                }

                startLoading().catch((err) => {
                    console.error("Error loading image", imageID, err);
                    cleanUp();
                });
            });
        })
        .catch((err) => {
            console.error("Error loading image", imageID, err);
            cleanUp();
        });

    return cleanUp;
}
