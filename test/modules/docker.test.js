const docker = require('../../src/modules/docker');

jest.mock('../../src/modules/options.js');

describe('getContainers', () => {
  it('should return an array of container ids', async () => {
    const containers = await docker.getContainers();
    expect(containers).toEqual([1, 2, 3]);
  });
});
