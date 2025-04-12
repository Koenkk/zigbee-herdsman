export class ZclTransactionSequenceNumber {
    private static number = 1;

    public static next(): number {
        ZclTransactionSequenceNumber.number++;

        if (ZclTransactionSequenceNumber.number > 255) {
            ZclTransactionSequenceNumber.number = 1;
        }

        return ZclTransactionSequenceNumber.number;
    }
}

export default ZclTransactionSequenceNumber;
