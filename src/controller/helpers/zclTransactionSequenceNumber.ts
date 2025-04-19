class ZclTransactionSequenceNumber {
    private number = 1;

    get current() {
        return this.number;
    }

    public next(): number {
        this.number++;

        if (this.number > 255) {
            this.number = 1;
        }

        return this.number;
    }
}

export default new ZclTransactionSequenceNumber();
