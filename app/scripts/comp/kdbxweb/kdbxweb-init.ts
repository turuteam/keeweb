import * as kdbxweb from 'kdbxweb';
import { Logger } from 'util/logger';
import { Features } from 'util/features';
import { NativeModules } from 'comp/launcher/native-modules';

const logger = new Logger('argon2');

interface Argon2WasmModule {
    ALLOC_NORMAL: 'ALLOC_NORMAL';

    HEAP8: Uint8Array;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    _free(ptr: number): void;
    allocate(buf: ArrayLike<number>, type: 'i8', flags: 'ALLOC_NORMAL'): number;

    // eslint-disable-next-line @typescript-eslint/naming-convention,camelcase
    _argon2_hash(
        iterations: number,
        memory: number,
        parallelism: number,
        password: number,
        passwordLen: number,
        salt: number,
        saltLen: number,
        hash: number,
        length: number,
        encoded: number,
        encodedLen: number,
        type: number,
        version: number
    ): number;
}

interface Argon2HashArgs {
    password: ArrayBuffer;
    salt: ArrayBuffer;
    memory: number;
    iterations: number;
    length: number;
    parallelism: number;
    type: kdbxweb.CryptoEngine.Argon2Type;
    version: kdbxweb.CryptoEngine.Argon2Version;
}

interface Argon2Runtime {
    hash(args: Argon2HashArgs): Promise<Uint8Array>;
}

let runtimeModule: Argon2Runtime | undefined;

interface MessageFromWorkerWorkerLog {
    op: 'log';
    args: unknown[];
}

interface MessageFromWorkerWorkerPostRun {
    op: 'postRun';
}

interface MessageFromWorkerWorkerHash {
    op: 'hash';
    hash: Uint8Array;
}

interface MessageFromWorkerWorkerError {
    op: 'error';
    error: string;
}

type MessageFromWorkerWorker =
    | MessageFromWorkerWorkerLog
    | MessageFromWorkerWorkerPostRun
    | MessageFromWorkerWorkerHash
    | MessageFromWorkerWorkerError;

const KdbxwebInit = {
    init(): void {
        kdbxweb.CryptoEngine.setArgon2Impl((...args) => this.argon2(...args));
    },

    async argon2(
        password: ArrayBuffer,
        salt: ArrayBuffer,
        memory: number,
        iterations: number,
        length: number,
        parallelism: number,
        type: kdbxweb.CryptoEngine.Argon2Type,
        version: kdbxweb.CryptoEngine.Argon2Version
    ): Promise<ArrayBuffer> {
        const runtime = await this.loadRuntime(memory);

        const ts = logger.ts();
        const hash = await runtime.hash({
            password,
            salt,
            memory,
            iterations,
            length,
            parallelism,
            type,
            version
        });

        logger.info('Hash computed', logger.ts(ts));
        return hash;
    },

    loadRuntime(requiredMemory: number): Promise<Argon2Runtime> {
        if (runtimeModule) {
            return Promise.resolve(runtimeModule);
        }
        if (!global.WebAssembly) {
            return Promise.reject(new Error('WebAssembly is not supported'));
        }
        if (Features.isDesktop) {
            logger.info('Using native argon2');
            runtimeModule = {
                hash(args) {
                    const ts = logger.ts();

                    const password = kdbxweb.ProtectedValue.fromBinary(args.password).dataAndSalt();
                    const salt = kdbxweb.ProtectedValue.fromBinary(args.salt).dataAndSalt();

                    return NativeModules.argon2(password, salt, {
                        type: args.type,
                        version: args.version,
                        hashLength: args.length,
                        timeCost: args.iterations,
                        parallelism: args.parallelism,
                        memoryCost: args.memory
                    })
                        .then((res) => {
                            password.data.fill(0);
                            salt.data.fill(0);

                            logger.info('Argon2 hash calculated', logger.ts(ts));

                            const pv = new kdbxweb.ProtectedValue(
                                kdbxweb.ByteUtils.arrayToBuffer(new Uint8Array(res.data)),
                                kdbxweb.ByteUtils.arrayToBuffer(new Uint8Array(res.salt))
                            );
                            return pv.getBinary();
                        })
                        .catch((err) => {
                            password.data.fill(0);
                            salt.data.fill(0);

                            logger.error('Argon2 error', err);
                            throw err;
                        });
                }
            };
            return Promise.resolve(runtimeModule);
        }
        return new Promise<Argon2Runtime>((resolve, reject) => {
            const loadTimeout = setTimeout(() => reject(new Error('Timeout')), 5000);
            try {
                const ts = logger.ts();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const argon2LoaderCode = require('argon2').default as string;
                const wasmBinaryBase64 = require('argon2-wasm') as string;

                const KB = 1024 * 1024;
                const MB = 1024 * KB;
                const GB = 1024 * MB;
                const WASM_PAGE_SIZE = 64 * 1024;
                const totalMemory = (2 * GB - 64 * KB) / 1024 / WASM_PAGE_SIZE;
                const initialMemory = Math.min(
                    Math.max(Math.ceil((requiredMemory * 1024) / WASM_PAGE_SIZE), 256) + 256,
                    totalMemory
                );

                const memoryDecl = `var wasmMemory=new WebAssembly.Memory({initial:${initialMemory},maximum:${totalMemory}});`;
                const moduleDecl =
                    'var Module={' +
                    'wasmJSMethod: "native-wasm",' +
                    `wasmBinary: Uint8Array.from(atob("${wasmBinaryBase64}"), c => c.charCodeAt(0)),` +
                    'print(...args) { postMessage({op:"log",args}) },' +
                    'printErr(...args) { postMessage({op:"log",args}) },' +
                    `postRun:${this.workerPostRun.toString()},` +
                    `calcHash:${this.calcHash.toString()},` +
                    'wasmMemory:wasmMemory,' +
                    'buffer:wasmMemory.buffer,' +
                    `TOTAL_MEMORY:${initialMemory * WASM_PAGE_SIZE}` +
                    '}';
                const script = argon2LoaderCode.replace(/^var Module.*?}/, memoryDecl + moduleDecl);
                const blob = new Blob([script], { type: 'application/javascript' });
                const objectUrl = URL.createObjectURL(blob);
                const worker = new Worker(objectUrl);
                const onMessage = (e: MessageEvent) => {
                    const data = e.data as MessageFromWorkerWorker;
                    switch (data.op) {
                        case 'log':
                            logger.info(...data.args);
                            break;
                        case 'postRun':
                            logger.info('WebAssembly runtime loaded (web worker)', logger.ts(ts));
                            URL.revokeObjectURL(objectUrl);
                            clearTimeout(loadTimeout);
                            worker.removeEventListener('message', onMessage);
                            runtimeModule = {
                                hash(args: Argon2HashArgs): Promise<Uint8Array> {
                                    return new Promise((resolve, reject) => {
                                        worker.postMessage(args);
                                        const onHashMessage = (e: MessageEvent) => {
                                            worker.removeEventListener('message', onHashMessage);
                                            worker.terminate();
                                            runtimeModule = undefined;
                                            const msg = e.data as MessageFromWorkerWorker;
                                            switch (msg.op) {
                                                case 'hash':
                                                    resolve(msg.hash);
                                                    break;
                                                case 'error':
                                                    logger.error('Worker error', msg.error);
                                                    reject(new Error(msg.error));
                                                    break;
                                                default:
                                                    reject(
                                                        new Error('Unexpected message from worker')
                                                    );
                                            }
                                        };
                                        worker.addEventListener('message', onHashMessage);
                                    });
                                }
                            };
                            resolve(runtimeModule);
                            break;
                        default:
                            logger.error('Unknown message', e.data);
                            URL.revokeObjectURL(objectUrl);
                            reject(new Error('Load error'));
                    }
                };
                worker.addEventListener('message', onMessage);
            } catch (err) {
                reject(err);
            }
        }).catch((err) => {
            logger.warn('WebAssembly error', err);
            throw new Error('WebAssembly error');
        });
    },

    // eslint-disable-next-line object-shorthand
    workerPostRun: function (): void {
        /* eslint-disable */
        const postRunMsg: MessageFromWorkerWorkerPostRun = { op: 'postRun' };
        (self as unknown as MessagePort).postMessage(postRunMsg);
        self.onmessage = (e: MessageEvent) => {
            try {
                // @ts-ignore
                const hash = Module.calcHash(Module, e.data) as Uint8Array;
                const hashMsg: MessageFromWorkerWorkerHash = { op: 'hash', hash };
                (self as unknown as MessagePort).postMessage(hashMsg);
            } catch (e) {
                const errMsg: MessageFromWorkerWorkerError = { op: 'error', error: e.toString() };
                (self as unknown as MessagePort).postMessage(errMsg);
            }
        };
        /* eslint-enable */
    },

    // eslint-disable-next-line object-shorthand
    calcHash: function (Module: Argon2WasmModule, args: Argon2HashArgs): Uint8Array {
        const { memory, iterations, length, parallelism, type, version } = args;
        const passwordLen = args.password.byteLength;
        const password = Module.allocate(new Uint8Array(args.password), 'i8', Module.ALLOC_NORMAL);
        const saltLen = args.salt.byteLength;
        const salt = Module.allocate(new Uint8Array(args.salt), 'i8', Module.ALLOC_NORMAL);
        const hash = Module.allocate(new Array(length), 'i8', Module.ALLOC_NORMAL);
        const encodedLen = 512;
        const encoded = Module.allocate(new Array(encodedLen), 'i8', Module.ALLOC_NORMAL);

        const res = Module._argon2_hash(
            iterations,
            memory,
            parallelism,
            password,
            passwordLen,
            salt,
            saltLen,
            hash,
            length,
            encoded,
            encodedLen,
            type,
            version
        );
        if (res) {
            throw new Error(`Argon2 error ${res}`);
        }
        const hashArr = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            hashArr[i] = Module.HEAP8[hash + i];
        }
        Module._free(password);
        Module._free(salt);
        Module._free(hash);
        Module._free(encoded);
        return hashArr;
    }
};

export { KdbxwebInit };
