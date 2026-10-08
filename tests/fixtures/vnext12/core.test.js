const { value } = require('../../../scripts/kodjo/fixtures/vnext12/core');
test('VNext-12 disposable value', () => {
  expect(value()).toBe(1);
});
