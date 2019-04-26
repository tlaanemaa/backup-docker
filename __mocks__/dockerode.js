const Docker = jest.genMockFromModule('dockerode');

Docker.prototype.listContainers = () => Promise.resolve([
  { Id: 1 },
  { Id: 2 },
  { Id: 3 },
]);

Docker.mockInspection = {
  Name: 'banana',
  State: {
    Running: true,
  },
  Mounts: [
    { Name: 'mount1', Destination: 'dest1' },
    { Name: 'mount2', Destination: 'dest2' },
  ],
};

Docker.prototype.getContainer = () => ({
  inspect: () => Promise.resolve(Docker.mockInspection),
  pause: () => null,
  unpause: () => null,
});

Docker.prototype.run = jest.fn().mockImplementation(() => Promise.resolve());

module.exports = Docker;
