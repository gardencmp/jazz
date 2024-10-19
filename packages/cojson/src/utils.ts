export function createResolvablePromise<T>() {
    let resolve!: (value: T) => void;

    const promise = new Promise<T>((res) => {
        resolve = res;
    });

    return { promise, resolve };
}
