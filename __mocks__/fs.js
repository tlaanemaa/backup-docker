const fs = jest.genMockFromModule('fs');

const mockInspectFile = `
{
  "Name": "/orange",
  "State": {
    "Running": true
  },
  "Mounts": [
    {
      "Name": "mount1",
      "Destination": "dest1"
    },
    {
      "Name": "mount2",
      "Destination": "dest2"
    }
  ],
  "Config": {},
  "HostConfig": {
    "NetworkMode": "mockMode"
  },
  "NetworkSettings": {
    "Networks": {}
  }
}
`;

fs.writeFile = jest.fn().mockImplementation((x, y, callback) => callback());
fs.readFile = jest.fn().mockImplementation((x, callback) => callback(null, mockInspectFile));
fs.readdirSync = jest.fn().mockReturnValue(['a.json', 'b.json', 'c.json']);

module.exports = fs;
