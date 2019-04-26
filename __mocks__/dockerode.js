const Docker = jest.genMockFromModule('dockerode');

Docker.prototype.listContainers = () => Promise.resolve([
  { Id: 1 },
  { Id: 2 },
  { Id: 3 },
]);

module.exports = Docker;
