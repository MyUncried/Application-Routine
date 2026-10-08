'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { constants } = require('node:buffer');
const V = require('../../scripts/kodjo/lib/vnext-contract');

test('stream preserves historical JSON bytes, ordering, escaping and IDs', () => {
  const sparse = new Array(3); sparse[1] = 'é';
  const values = [null, true, -0, 1e-7, 1e21, [], sparse,
    { '10': 'dix', '2': 'deux', z: ['a', { b: 1, a: 2 }], a: '\"\\\n\t' },
    JSON.parse('{"__proto__":{"safe":true},"constructor":"x","01":1}'),
    Object.assign(Object.create(null), { z: false, a: 3 }),
    'x'.repeat(4095) + '😀' + '\ud800' + '\udc00' + '\ud800' + 'é'.repeat(70000),
  ];
  for (const value of values) {
    let actual = '', maxChunk = 0;
    V.writeCanonical(value, chunk => { actual += chunk; maxChunk = Math.max(maxChunk, chunk.length); });
    const historical = V.canonicalStringify(value);
    assert.equal(actual, historical);
    assert.equal(V.canonicalHash(value), V.sha256(historical));
    assert.ok(maxChunk < 100000);
  }
});

test('stream keeps canonical rejection codes and does not cache mutable objects', () => {
  for (const value of [NaN, Infinity, undefined, { a: undefined }, [undefined], new Date(), { a: () => 1 }]) {
    let historical;
    try { V.canonicalStringify(value); } catch (error) { historical = error.code; }
    assert.ok(historical);
    assert.throws(() => V.canonicalHash(value), error => error.code === historical);
  }
  const nested = { value: 1 };
  const sealed = V.sealContract({ nested });
  assert.equal(V.verifyContractHash(sealed), true);
  nested.value = 2;
  assert.throws(() => V.verifyContractHash(sealed), { code: 'VNEXT_CONTRACT_HASH_MISMATCH' });
});

test('seal and verify a logical JSON larger than V8 MAX_STRING_LENGTH', () => {
  const text = 'x'.repeat(16384);
  const encoded = JSON.stringify(text);
  const count = Math.ceil(constants.MAX_STRING_LENGTH / (encoded.length + 1)) + 1;
  const values = Array(count).fill(text);
  const expected = crypto.createHash('sha256');
  expected.update('{"values":[');
  for (let i = 0; i < count; i += 1) { if (i) expected.update(','); expected.update(encoded); }
  expected.update(']}');
  assert.ok(count * (encoded.length + 1) > constants.MAX_STRING_LENGTH);
  const sealed = V.sealContract({ values });
  assert.equal(sealed.contract_hash, expected.digest('hex'));
  assert.equal(V.verifyContractHash(sealed), true);
});
