import { DateTime } from "luxon";

const M125x = [
    [50000,     0.4,  0],
    [250000,    0.5,  50],
    [1000000,   1.0,  1300],
    [5000000,   2.5,  16300],
    [20000000,  5.0,  141300],
    [50000000,  10.0, 1141300],
    [100000000, 12.5, 2391300],
    [200000000, 15.0, 4891300],
    [200000001, 25.0, 24891300]
];

const M100x = [
    [10000,     0.5,    0],
    [100000,    0.65,   15],
    [500000,    1.0,    365],
    [1000000,   2.0,    5365],
    [2000000,   5.0,    35365],
    [50000000,  10.0,   135365],
    [100000000, 12.5,   260365],
    [200000000, 15.0,   510365],
    [200000001, 25.0,   2510365]
];

const M75x = [
    [10000,    0.65,  0],
    [50000,    1.00,  35],
    [250000,   2.00,  535],
    [1000000,  5.00,  8035],
    [2000000,  10.00, 58035],
    [5000000,  12.50, 108035],
    [10000000, 15.00, 233035],
    [10000001, 25.00, 1233035]
];

const M50x = [
    [5000,    1.0,  0],
    [25000,   2.5,  75],
    [100000,  5.0,  700],
    [250000,  10.0, 5700],
    [1000000, 12.5, 11950],
    [1000001, 50.0, 386950]
];

const MLOOKUP = new Map([
    ['BTCUSDT', M125x],
    ['ETHUSDT', M100x],
    ['ADAUSDT', M75x],
    ['BNBUSDT', M75x],
    ['DOTUSDT', M75x],
    ['EOSUSDT', M75x],
    ['ETCUSDT', M75x],
    ['LINKUSDT', M75x],
    ['LTCUSDT', M75x],
    ['TRXUSDT', M75x],
    ['XLMUSDT', M75x],
    ['XMRUSDT', M75x],
    ['XRPUSDT', M75x],
    ['XTZUSDT', M75x],
    ['BCHUSDT', M75x],
    ['OTHERS', M50x]
]);

interface PositionRisks {
    walletBalance: number,
    side: 'BUY' | 'SELL',
    positionAmount: number,
    entryPrice: number,
}

export function getLiquidationPrice(symbol: string, positionRisks: PositionRisks) {
    const { side, walletBalance, positionAmount, entryPrice } = positionRisks;
    const s1b = side === 'BUY' ? 1 : -1;
    const notionalSize = positionAmount * entryPrice;
    const mt = MLOOKUP.get(symbol) ?? MLOOKUP.get('OTHERS')!;
    let mRatio = 0, mAmount = 0;
    for (const row of mt) {
        if (notionalSize < row[0]) {
            mRatio = row[1] / 100;
            mAmount = row[2];
            break;
        }
    }
    const f1 = walletBalance + mAmount - (s1b * notionalSize);
    const f2 = (positionAmount * mRatio) - (s1b * positionAmount);
    return f1 / f2;
}

export function getFloatFixed(n: number) {
    return n > 1000 ? 1 : n > 100 ? 2 : n > 10 ? 3 : n > 1 ? 4 : 6;
}

export function getFixedNumber(n: number, fixed?: number) {
    if (fixed) {
        return n.toLocaleString('ko-KR', { maximumFractionDigits: fixed });
    }
    else {
        const f = getFloatFixed(n);
        return n.toLocaleString('ko-KR', { maximumFractionDigits: f });
    }
}

export function convertMillisTime(time: number) {
    return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_SHORT)
}