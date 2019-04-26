const docker = require('../../src/modules/docker');

jest.mock('../../src/modules/options.js');

describe('docker', () => {
  it('should have docker', () => {
    expect(docker.docker).not.toBe(null);
  });
});
