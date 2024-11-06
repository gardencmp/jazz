import { BlockFilename, CryptoProvider, FileSystem, WalFilename } from "cojson";

export class OPFSFilesystem
  implements
    FileSystem<
      { id: number; filename: string },
      { id: number; filename: string }
    >
{
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

  listFiles(): Promise<string[]> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      performance.mark("listFiles" + requestId + "_listFiles");
      this.callbacks.set(requestId, (event) => {
        performance.mark("listFilesEnd" + requestId + "_listFiles");
        performance.measure(
          "listFiles" + requestId + "_listFiles",
          "listFiles" + requestId + "_listFiles",
          "listFilesEnd" + requestId + "_listFiles",
        );
        resolve(event.data.fileNames);
      });
      this.opfsWorker.postMessage({ type: "listFiles", requestId });
    });
  }

  openToRead(
    filename: string,
  ): Promise<{ handle: { id: number; filename: string }; size: number }> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      performance.mark("openToRead" + "_" + filename);
      this.callbacks.set(requestId, (event) => {
        resolve({
          handle: { id: event.data.handle, filename },
          size: event.data.size,
        });
        performance.mark("openToReadEnd" + "_" + filename);
        performance.measure(
          "openToRead" + "_" + filename,
          "openToRead" + "_" + filename,
          "openToReadEnd" + "_" + filename,
        );
      });
      this.opfsWorker.postMessage({
        type: "openToRead",
        filename,
        requestId,
      });
    });
  }

  createFile(filename: string): Promise<{ id: number; filename: string }> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      performance.mark("createFile" + "_" + filename);
      this.callbacks.set(requestId, (event) => {
        performance.mark("createFileEnd" + "_" + filename);
        performance.measure(
          "createFile" + "_" + filename,
          "createFile" + "_" + filename,
          "createFileEnd" + "_" + filename,
        );
        resolve({ id: event.data.handle, filename });
      });
      this.opfsWorker.postMessage({
        type: "createFile",
        filename,
        requestId,
      });
    });
  }

  openToWrite(filename: string): Promise<{ id: number; filename: string }> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      performance.mark("openToWrite" + "_" + filename);
      this.callbacks.set(requestId, (event) => {
        performance.mark("openToWriteEnd" + "_" + filename);
        performance.measure(
          "openToWrite" + "_" + filename,
          "openToWrite" + "_" + filename,
          "openToWriteEnd" + "_" + filename,
        );
        resolve({ id: event.data.handle, filename });
      });
      this.opfsWorker.postMessage({
        type: "openToWrite",
        filename,
        requestId,
      });
    });
  }

  append(
    handle: { id: number; filename: string },
    data: Uint8Array,
  ): Promise<void> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      performance.mark("append" + "_" + handle.filename);
      this.callbacks.set(requestId, (_) => {
        performance.mark("appendEnd" + "_" + handle.filename);
        performance.measure(
          "append" + "_" + handle.filename,
          "append" + "_" + handle.filename,
          "appendEnd" + "_" + handle.filename,
        );
        resolve(undefined);
      });
      this.opfsWorker.postMessage({
        type: "append",
        handle: handle.id,
        data,
        requestId,
      });
    });
  }

  read(
    handle: { id: number; filename: string },
    offset: number,
    length: number,
  ): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      performance.mark("read" + "_" + handle.filename);
      this.callbacks.set(requestId, (event) => {
        performance.mark("readEnd" + "_" + handle.filename);
        performance.measure(
          "read" + "_" + handle.filename,
          "read" + "_" + handle.filename,
          "readEnd" + "_" + handle.filename,
        );
        resolve(event.data.data);
      });
      this.opfsWorker.postMessage({
        type: "read",
        handle: handle.id,
        offset,
        length,
        requestId,
      });
    });
  }

  close(handle: { id: number; filename: string }): Promise<void> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      performance.mark("close" + "_" + handle.filename);
      this.callbacks.set(requestId, (_) => {
        performance.mark("closeEnd" + "_" + handle.filename);
        performance.measure(
          "close" + "_" + handle.filename,
          "close" + "_" + handle.filename,
          "closeEnd" + "_" + handle.filename,
        );
        resolve(undefined);
      });
      this.opfsWorker.postMessage({
        type: "close",
        handle: handle.id,
        requestId,
      });
    });
  }

  closeAndRename(
    handle: { id: number; filename: string },
    filename: BlockFilename,
  ): Promise<void> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      performance.mark("closeAndRename" + "_" + handle.filename);
      this.callbacks.set(requestId, () => {
        performance.mark("closeAndRenameEnd" + "_" + handle.filename);
        performance.measure(
          "closeAndRename" + "_" + handle.filename,
          "closeAndRename" + "_" + handle.filename,
          "closeAndRenameEnd" + "_" + handle.filename,
        );
        resolve(undefined);
      });
      this.opfsWorker.postMessage({
        type: "closeAndRename",
        handle: handle.id,
        filename,
        requestId,
      });
    });
  }

  removeFile(filename: BlockFilename | WalFilename): Promise<void> {
    return new Promise((resolve) => {
      const requestId = this.nextRequestId++;
      performance.mark("removeFile" + "_" + filename);
      this.callbacks.set(requestId, () => {
        performance.mark("removeFileEnd" + "_" + filename);
        performance.measure(
          "removeFile" + "_" + filename,
          "removeFile" + "_" + filename,
          "removeFileEnd" + "_" + filename,
        );
        resolve(undefined);
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
