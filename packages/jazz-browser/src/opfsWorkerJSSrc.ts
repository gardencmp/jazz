export const opfsWorkerJSSrc = `

    let rootDirHandle;
    const handlesByRequest = new Map();
    const handlesByFilename = new Map();

    onmessage = async (event) => {
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
                syncHandle = existingHandle;
            } else {
                const handle = await rootDirHandle.getFileHandle(event.data.filename);
                syncHandle = await handle.createSyncAccessHandle();
            }
            handlesByRequest.set(event.data.requestId, syncHandle);
            handlesByFilename.set(event.data.filename, syncHandle);
            postMessage({requestId: event.data.requestId, handle: event.data.requestId, size: syncHandle.getSize()});
        } else if (event.data.type === "createFile") {
            const handle = await rootDirHandle.getFileHandle(event.data.filename, {
                create: true,
            });
            const syncHandle = await handle.createSyncAccessHandle();
            handlesByRequest.set(event.data.requestId, syncHandle);
            handlesByFilename.set(event.data.filename, syncHandle);
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
        } else if (event.data.type === "renameAndClose") {
            const handle = handlesByRequest.get(event.data.handle);
            const newHandle = await rootDirHandle.getFileHandle(event.data.filename, { create: true });
            const writable = await newHandle.createSyncAccessHandle();
            writable.write(handle.read(new Uint8Array(handle.getSize())));
            writable.flush();
            writable.close();
            postMessage({requestId: event.data.requestId, result: "done"});
        } else {
            console.error("Unknown event type", event.data.type);
        }
    };

    //# sourceURL=opfsWorker.js
    `;
