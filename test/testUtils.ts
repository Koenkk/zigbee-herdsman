function duplicateArray(amount, value) {
    let result = [];
    for (let i = 0; i < amount; i++) {
        result = result.concat(value);
    }

    return result;
}

const ieeeaAddr1 = {
    string: '0xae440112004b1200',
    hex: [0x00, 0x12, 0x4b, 0x00, 0x12, 0x01, 0x44, 0xae],
};

const ieeeaAddr2 = {
    string: '0xaf440112005b1200',
    hex: [0x00, 0x12, 0x5b, 0x00, 0x12, 0x01, 0x44, 0xaf],
};

export {duplicateArray, ieeeaAddr1, ieeeaAddr2};
