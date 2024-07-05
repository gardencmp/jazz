import {
    BlockFilename,
    FSErr,
    FileSystem,
    WalFilename,
    CryptoProvider,
} from "cojson";
import { Effect } from "effect";

export class OPFSFilesystem implements FileSystem<number, number> {
    opfsWorker: Worker;
    callbacks: Map<number, (event: MessageEvent) => void> = new Map();
    nextRequestId = 0;

    constructor(public crypto: CryptoProvider) {
        this.opfsWorker = new Worker(
            URL.createObjectURL(
                new Blob([opfsWorkerJSSrc], { type: "text/javascript" }),
            ),
        );
        this.opfsWorker.onmessage = (event) => {
            // console.log("Received from OPFS worker", event.data);
            const handler = this.callbacks.get(event.data.requestId);
            if (handler) {
                handler(event);
                this.callbacks.delete(event.data.requestId);
            }
        };
    }

    listFiles(): Effect.Effect<string[], FSErr, never> {
        return Effect.async((cb) => {
            const requestId = this.nextRequestId++;
            performance.mark("listFiles" + requestId);
            this.callbacks.set(requestId, (event) => {
                performance.mark("listFilesEnd" + requestId);
                performance.measure(
                    "listFiles" + requestId,
                    "listFiles" + requestId,
                    "listFilesEnd" + requestId,
                );
                cb(Effect.succeed(event.data.fileNames));
            });
            this.opfsWorker.postMessage({ type: "listFiles", requestId });
        });
    }

    openToRead(
        filename: string,
    ): Effect.Effect<{ handle: number; size: number }, FSErr, never> {
        return Effect.async((cb) => {
            const requestId = this.nextRequestId++;
            performance.mark("openToRead" + requestId);
            this.callbacks.set(requestId, (event) => {
                cb(
                    Effect.succeed({
                        handle: event.data.handle,
                        size: event.data.size,
                    }),
                );
                performance.mark("openToReadEnd" + requestId);
                performance.measure(
                    "openToRead" + requestId,
                    "openToRead" + requestId,
                    "openToReadEnd" + requestId,
                );
            });
            this.opfsWorker.postMessage({
                type: "openToRead",
                filename,
                requestId,
            });
        });
    }

    createFile(filename: string): Effect.Effect<number, FSErr, never> {
        return Effect.async((cb) => {
            const requestId = this.nextRequestId++;
            performance.mark("createFile" + requestId);
            this.callbacks.set(requestId, (event) => {
                performance.mark("createFileEnd" + requestId);
                performance.measure(
                    "createFile" + requestId,
                    "createFile" + requestId,
                    "createFileEnd" + requestId,
                );
                cb(Effect.succeed(event.data.handle));
            });
            this.opfsWorker.postMessage({
                type: "createFile",
                filename,
                requestId,
            });
        });
    }

    openToWrite(
        filename: string,
    ): Effect.Effect<FileSystemFileHandle, FSErr, never> {
        return Effect.async((cb) => {
            const requestId = this.nextRequestId++;
            performance.mark("openToWrite" + requestId);
            this.callbacks.set(requestId, (event) => {
                performance.mark("openToWriteEnd" + requestId);
                performance.measure(
                    "openToWrite" + requestId,
                    "openToWrite" + requestId,
                    "openToWriteEnd" + requestId,
                );
                cb(Effect.succeed(event.data.handle));
            });
            this.opfsWorker.postMessage({
                type: "openToWrite",
                filename,
                requestId,
            });
        });
    }

    append(
        handle: number,
        data: Uint8Array,
    ): Effect.Effect<void, FSErr, never> {
        return Effect.async((cb) => {
            const requestId = this.nextRequestId++;
            performance.mark("append" + requestId);
            this.callbacks.set(requestId, (_) => {
                performance.mark("appendEnd" + requestId);
                performance.measure(
                    "append" + requestId,
                    "append" + requestId,
                    "appendEnd" + requestId,
                );
                cb(Effect.succeed(undefined));
            });
            this.opfsWorker.postMessage({
                type: "append",
                handle,
                data,
                requestId,
            });
        });
    }

    read(
        handle: number,
        offset: number,
        length: number,
    ): Effect.Effect<Uint8Array, FSErr, never> {
        return Effect.async((cb) => {
            const requestId = this.nextRequestId++;
            performance.mark("read" + requestId);
            this.callbacks.set(requestId, (event) => {
                performance.mark("readEnd" + requestId);
                performance.measure(
                    "read" + requestId,
                    "read" + requestId,
                    "readEnd" + requestId,
                );
                cb(Effect.succeed(event.data.data));
            });
            this.opfsWorker.postMessage({
                type: "read",
                handle,
                offset,
                length,
                requestId,
            });
        });
    }

    close(handle: number): Effect.Effect<void, FSErr, never> {
        return Effect.async((cb) => {
            const requestId = this.nextRequestId++;
            performance.mark("close" + requestId);
            this.callbacks.set(requestId, (_) => {
                performance.mark("closeEnd" + requestId);
                performance.measure(
                    "close" + requestId,
                    "close" + requestId,
                    "closeEnd" + requestId,
                );
                cb(Effect.succeed(undefined));
            });
            this.opfsWorker.postMessage({
                type: "close",
                handle,
                requestId,
            });
        });
    }

    closeAndRename(
        handle: number,
        filename: BlockFilename,
    ): Effect.Effect<void, FSErr, never> {
        return Effect.async((cb) => {
            const requestId = this.nextRequestId++;
            performance.mark("closeAndRename" + requestId);
            this.callbacks.set(requestId, () => {
                performance.mark("closeAndRenameEnd" + requestId);
                performance.measure(
                    "closeAndRename" + requestId,
                    "closeAndRename" + requestId,
                    "closeAndRenameEnd" + requestId,
                );
                cb(Effect.succeed(undefined));
            });
            this.opfsWorker.postMessage({
                type: "closeAndRename",
                handle,
                filename,
                requestId,
            });
        });
    }

    removeFile(
        filename: BlockFilename | WalFilename,
    ): Effect.Effect<void, FSErr, never> {
        return Effect.async((cb) => {
            const requestId = this.nextRequestId++;
            performance.mark("removeFile" + requestId);
            this.callbacks.set(requestId, () => {
                performance.mark("removeFileEnd" + requestId);
                performance.measure(
                    "removeFile" + requestId,
                    "removeFile" + requestId,
                    "removeFileEnd" + requestId,
                );
                cb(Effect.succeed(undefined));
            });
            this.opfsWorker.postMessage({
                type: "removeFile",
                filename,
                requestId,
            });
        });
    }
}

const opfsWorkerJSSrc = `

    let rootDirHandle;
    const handlesByRequest = new Map();
    const handlesByFilename = new Map();
    const filenamesForHandles = new Map();

    onmessage = async function handleEvent(event) {
        rootDirHandle = rootDirHandle || await navigator.storage.getDirectory();
        // console.log("Received in OPFS worker", {...event.data, data: event.data.data ? "some data of length " + event.data.data.length : undefined});
        if (event.data.type === "listFiles") {
            const fileNames = [];
            for await (const entry of rootDirHandle.values()) {
                if (entry.kind === "file") {
                    fileNames.push(entry.name);
                }
            }
            postMessage({requestId: event.data.requestId, fileNames});
        } else if (event.data.type === "openToRead" || event.data.type === "openToWrite") {
            let syncHandle;
            const existingHandle = handlesByFilename.get(event.data.filename);
            if (existingHandle) {
                throw new Error("Handle already exists for file: " + event.data.filename);
            } else {
                const handle = await rootDirHandle.getFileHandle(event.data.filename);
                try {
                    syncHandle = await handle.createSyncAccessHandle();
                } catch (e) {
                    throw new Error("Couldn't open file for reading: " + event.data.filename, {cause: e});
                }
            }
            handlesByRequest.set(event.data.requestId, syncHandle);
            handlesByFilename.set(event.data.filename, syncHandle);
            filenamesForHandles.set(syncHandle, event.data.filename);
            let size;
            try {
                size = syncHandle.getSize();
            } catch (e) {
                throw new Error("Couldn't get size of file: " + event.data.filename, {cause: e});
            }
            postMessage({requestId: event.data.requestId, handle: event.data.requestId, size});
        } else if (event.data.type === "createFile") {
            const handle = await rootDirHandle.getFileHandle(event.data.filename, {
                create: true,
            });
            let syncHandle;
            try {
                syncHandle = await handle.createSyncAccessHandle();
            } catch (e) {
                throw new Error("Couldn't create file: " + event.data.filename, {cause: e});
            }
            handlesByRequest.set(event.data.requestId, syncHandle);
            handlesByFilename.set(event.data.filename, syncHandle);
            filenamesForHandles.set(syncHandle, event.data.filename);
            postMessage({requestId: event.data.requestId, handle: event.data.requestId, result: "done"});
        } else if (event.data.type === "append") {
            const writable = handlesByRequest.get(event.data.handle);
            writable.write(event.data.data, {at: writable.getSize()});
            writable.flush();
            postMessage({requestId: event.data.requestId, result: "done"});
        } else if (event.data.type === "read") {
            const readable = handlesByRequest.get(event.data.handle);
            const buffer = new Uint8Array(event.data.length);
            const read = readable.read(buffer, {at: event.data.offset});
            if (read < event.data.length) {
                throw new Error("Couldn't read enough");
            }
            postMessage({requestId: event.data.requestId, data: buffer, result: "done"});
        } else if (event.data.type === "close") {
            const handle = handlesByRequest.get(event.data.handle);
            // console.log("Closing handle", filenamesForHandles.get(handle), event.data.handle, handle);
            handle.flush();
            handle.close();
            handlesByRequest.delete(handle);
            const filename = filenamesForHandles.get(handle);
            handlesByFilename.delete(filename);
            filenamesForHandles.delete(handle);
            postMessage({requestId: event.data.requestId, result: "done"});
        } else if (event.data.type === "closeAndRename") {
            const handle = handlesByRequest.get(event.data.handle);
            handle.flush();
            const buffer = new Uint8Array(handle.getSize());
            const read = handle.read(buffer, {at: 0});
            if (read < buffer.length) {
                throw new Error("Couldn't read enough " + read + ", " + handle.getSize());
            }
            handle.close();
            const oldFilename = filenamesForHandles.get(handle);
            await rootDirHandle.removeEntry(oldFilename);

            const newHandle = await rootDirHandle.getFileHandle(event.data.filename, { create: true });
            let writable;
            try {
                writable = await newHandle.createSyncAccessHandle();
            } catch (e) {
                throw new Error("Couldn't create file (to rename to): " + event.data.filename, { cause: e })
            }
            writable.write(buffer);
            writable.close();
            postMessage({requestId: event.data.requestId, result: "done"});
        } else if (event.data.type === "removeFile") {
            try {
                await rootDirHandle.removeEntry(event.data.filename);
            } catch(e) {
                throw new Error("Couldn't remove file: " + event.data.filename, { cause: e });
            }
            postMessage({requestId: event.data.requestId, result: "done"});
        } else {
            console.error("Unknown event type", event.data.type);
        }
    };

    //# sourceURL=opfsWorker.js
    `;
