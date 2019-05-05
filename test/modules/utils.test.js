jest.mock('fs');
jest.mock('../../src/modules/options.js');
const { round } = require('../../src/modules/utils');

describe('round', () => {
  it('should round to given decimals', () => {
    expect(round(1.234567, 2)).toBe(1.23);
  });

  it('should round to 0 decimals by default', () => {
    expect(round(1.234567)).toBe(1);
  });
});
