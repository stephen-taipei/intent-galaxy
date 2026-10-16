import assert from "node:assert/strict";
import { canonicalize, specHash } from "./jcs.ts";

// 字元一律用 code point 建構，避免編輯器或傳輸把跳脫序列改寫成實際字元。
const ch = (...cps: number[]) => String.fromCodePoint(...cps);
const BS = "\\";

// RFC 8785 §3.2.2：數字與字串序列化範例
const rfcInput = {
  numbers: [333333333.33333329, 1E30, 4.50, 2e-3, 0.000000000000000000000000001],
  string: ch(0x20ac) + "$" + ch(0x0f) + ch(0x0a) + "A'B" + '"' + BS + BS + '"/',
  literals: [null, true, false],
};
const expected = '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"'
  + ch(0x20ac) + "$" + BS + "u000f" + BS + "nA'B" + BS + '"' + BS + BS + BS + BS + BS + '"/"}';
assert.equal(canonicalize(rfcInput), expected);

// RFC 8785 §3.2.3：鍵依 UTF-16 code unit 排序
const keys = [ch(0x20ac), ch(0x0d), ch(0xfb33), "1", ch(0x1f600), ch(0x80), ch(0xf6)];
const sorted = [ch(0x0d), "1", ch(0x80), ch(0xf6), ch(0x20ac), ch(0x1f600), ch(0xfb33)];
const parsed = JSON.parse(canonicalize(Object.fromEntries(keys.map((k, i) => [k, i]))));
assert.deepEqual(Object.keys(parsed).sort((x, y) => canonicalize(parsed).indexOf(JSON.stringify(x)) - canonicalize(parsed).indexOf(JSON.stringify(y))), sorted);

assert.throws(() => canonicalize({ x: NaN }));
assert.throws(() => canonicalize(ch(0xd800)));
assert.equal(canonicalize({ b: 1, a: [undefined, -0] }), '{"a":[null,0],"b":1}');
// echo -n '{"a":1}' | shasum -a 256
assert.equal(await specHash({ a: 1 }), "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862");
console.log("✅ libs/protocol JCS verified!");
