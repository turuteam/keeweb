class FileController {
    open(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
            throw new Error('Not implemented');
        });
    }
}

const instance = new FileController();

export { instance as FileController };
