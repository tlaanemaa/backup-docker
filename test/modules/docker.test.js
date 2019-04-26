jest.mock('fs');
jest.mock('dockerode');
jest.mock('../../src/modules/options.js');

const fs = require('fs');
const dockerode = require('dockerode');
const docker = require('../../src/modules/docker');

beforeEach(() => {
  fs.writeFile.mockClear();
});

describe('getContainers', () => {
  it('should return an array of container ids', async () => {
    const containers = await docker.getContainers();
    expect(containers).toEqual([1, 2, 3]);
  });
});

describe('backupContainer', () => {
  it('should should write inspect file', async () => {
    await docker.backupContainer(3);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/folder/containers/banana.json',
      JSON.stringify(dockerode.mockInspection, null, 2),
      expect.any(Function),
    );
  });
});
