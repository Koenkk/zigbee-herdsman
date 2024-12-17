export class ZclTransactionSequenceNumber {
    private static number = 1;

    public static next(): number {
        this.number++;

        if (this.number > 255) {
            this.number = 1;
        }

        return this.number;
    }
}

export default ZclTransactionSequenceNumber;
