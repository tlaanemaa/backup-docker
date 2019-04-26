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

const container = {
  inspect: () => Promise.resolve(Docker.mockInspection),
  pause: () => Promise.resolve(),
  unpause: () => Promise.resolve(),
  start: () => Promise.resolve(),
};

Docker.prototype.getContainer = () => container;

Docker.prototype.run = jest.fn().mockResolvedValue();
Docker.prototype.createContainer = jest.fn().mockResolvedValue(container);

module.exports = Docker;
