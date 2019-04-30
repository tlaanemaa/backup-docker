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
    { Name: 'mount1', Destination: 'dest1', Type: 'volume' },
    { Name: 'mount2', Destination: 'dest2', Type: 'volume' },
  ],
};

Docker.mockContainer = {
  inspect: () => Promise.resolve(Docker.mockInspection),
  start: () => Promise.resolve(),
  stop: () => Promise.resolve(),
  wait: () => Promise.resolve(),
};

Docker.prototype.getContainer = () => Docker.mockContainer;

Docker.prototype.run = jest.fn().mockResolvedValue();
Docker.prototype.createContainer = jest.fn().mockResolvedValue(Docker.mockContainer);

module.exports = Docker;
