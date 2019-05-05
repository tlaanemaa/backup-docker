const Dockerode = jest.genMockFromModule('dockerode');

// Mock constructor
class Docker extends Dockerode {
  constructor(...args) {
    super(...args);
    this.modem = {
      followProgress: (_, onFinished, onProgress) => {
        onProgress(...Docker.mockOnProgressArgs);
        onFinished(...Docker.mockOnFinishedArgs);
      },
    };
  }
}

Docker.prototype.listContainers = () => Promise.resolve([
  { Id: 1 },
  { Id: 2 },
  { Id: 3 },
]);

Docker.mockOnFinishedArgs = [null, 'orange'];
Docker.mockOnProgressArgs = [{ status: 'banana', progressDetail: { current: 5, total: 100 } }];

Docker.mockInspection = {
  Name: 'banana',
  State: {
    Running: true,
  },
  Mounts: [
    { Name: 'mount1', Destination: 'dest1', Type: 'volume' },
    { Name: 'mount2', Destination: 'dest2', Type: 'volume' },
  ],
  Config: {
    Image: 'mock/image',
  },
};

Docker.mockContainer = {
  inspect: () => Promise.resolve(Docker.mockInspection),
  start: () => Promise.resolve(),
  stop: () => Promise.resolve(),
  wait: () => Promise.resolve(),
};

Docker.mockImage = {
  inspect: () => {
    throw new Error('Image does not exist');
  },
};

Docker.prototype.getContainer = () => Docker.mockContainer;
Docker.prototype.getImage = () => Docker.mockImage;
Docker.prototype.run = jest.fn().mockResolvedValue();
Docker.prototype.createContainer = jest.fn().mockResolvedValue(Docker.mockContainer);
Docker.prototype.pull = jest.fn().mockImplementation((name, callback) => {
  callback(null, 'stream');
});

module.exports = Docker;
