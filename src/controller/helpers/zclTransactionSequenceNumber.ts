class ZclTransactionSequenceNumber {
    private sequence = -1;

    get current() {
        return this.sequence;
    }

    public next(): number {
        this.sequence = (this.sequence + 1) % 256;

        return this.sequence;
    }
}

export default new ZclTransactionSequenceNumber();
