class ZclTransactionSequenceNumber {
    private static number: number = 0;

    public static next(): number {
        this.number++;

        if (this.number > 255) {
            this.number = 0;
        }

        return this.number;
    }
}

export default ZclTransactionSequenceNumber;