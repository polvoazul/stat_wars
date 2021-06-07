import {Normalizer} from "../stats"
import * as dfd from "danfojs/src/index"

test('normalize stats', () => {
    function _test(mean, target) {
        let n = new Normalizer()
        let col = new dfd.DataFrame([{cname:mean}]).cname
        let out = n.normalize_stat(col, target), mul = n.multipliers.cname
        return [out.mean(), mul]
    }
    let [out, mul] = _test(5, 10)
    expect(out).toBe(10)
    expect(mul).toBe(2)

    let [out2, mul2] = _test(6, 10)
    expect(out2).toBe(12)
    expect(mul2).toBe(2)

    let [out3, mul3] = _test(22, 20)
    expect(out3).toBe(22)
    expect(mul3).toBe(1)

    let [out4, mul4] = _test(31.5, 1)
    expect(out4).toBe(0.63)
    expect(mul4).toBe(0.02)
});

