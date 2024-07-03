function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve): void => {
        setTimeout((): void => resolve(), milliseconds);
    });
}

export default wait;
