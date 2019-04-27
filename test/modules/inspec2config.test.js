const inspect2config = require('../../src/modules/inspect2config');

describe('inspect2config', () => {
  it('should parse the inspection result into a config', () => {
    const config = inspect2config({
      Name: '/orange',
      State: {
        Running: true,
      },
      Mounts: [
        {
          Name: 'mount1',
          Destination: 'dest1',
        },
        {
          Name: 'mount2',
          Destination: 'dest2',
        },
      ],
      Config: {
        Hostname: 'banana-host',
        ExposedPorts: {
          '25565/tcp': {},
          '25575/tcp': {},
        },
      },
      HostConfig: {
        NetworkMode: 'mockMode',
      },
      NetworkSettings: {
        Networks: {},
      },
    });

    expect(config).toEqual({
      name: 'orange',
      Hostname: 'banana-host',
      ExposedPorts: {
        '25565/tcp': {},
        '25575/tcp': {},
      },
      HostConfig: {
        Binds: ['mount1:dest1', 'mount2:dest2'],
        NetworkMode: 'mockMode',
      },
      NetworkingConfig: {
        EndpointsConfig: {},
      },
      Volumes: {
        dest1: {},
        dest2: {},
      },
    });
  });

  it('should hostname and exposed ports when NetworkMode is container:', () => {
    const config = inspect2config({
      Name: '/orange',
      State: {
        Running: true,
      },
      Mounts: [
        {
          Name: 'mount1',
          Destination: 'dest1',
        },
        {
          Name: 'mount2',
          Destination: 'dest2',
        },
      ],
      Config: {
        Hostname: 'banana-host',
        ExposedPorts: {
          '25565/tcp': {},
          '25575/tcp': {},
        },
      },
      HostConfig: {
        NetworkMode: 'container:something',
      },
      NetworkSettings: {
        Networks: {},
      },
    });

    expect(config.Hostname).toBe(undefined);
    expect(config.ExposedPorts).toBe(undefined);
  });

  it('should add :ro to read-only mounts', () => {
    const config = inspect2config({
      Name: '/orange',
      State: {
        Running: true,
      },
      Mounts: [
        {
          Name: 'mount1',
          Destination: 'dest1',
        },
        {
          Name: 'mount2',
          Destination: 'dest2',
          RW: false,
        },
      ],
      Config: {
        Hostname: 'banana-host',
        ExposedPorts: {
          '25565/tcp': {},
          '25575/tcp': {},
        },
      },
      HostConfig: {
        NetworkMode: 'mockMode',
      },
      NetworkSettings: {
        Networks: {},
      },
    });

    expect(config.HostConfig.Binds[1]).toBe('mount2:dest2:ro');
  });

  it('should use Source if Name is not provided', () => {
    const config = inspect2config({
      Name: '/orange',
      State: {
        Running: true,
      },
      Mounts: [
        {
          Source: 'mount1_src',
          Destination: 'dest1',
        },
        {
          Name: 'mount2',
          Destination: 'dest2',
        },
      ],
      Config: {
        Hostname: 'banana-host',
        ExposedPorts: {
          '25565/tcp': {},
          '25575/tcp': {},
        },
      },
      HostConfig: {
        NetworkMode: 'mockMode',
      },
      NetworkSettings: {
        Networks: {},
      },
    });

    expect(config.HostConfig.Binds[0]).toBe('mount1_src:dest1');
  });

  it('should ignore mounts without name or source and destination', () => {
    const config = inspect2config({
      Name: '/orange',
      State: {
        Running: true,
      },
      Mounts: [
        {
          Destination: 'dest1',
        },
        {
          Name: 'mount2',
        },
      ],
      Config: {
        Hostname: 'banana-host',
        ExposedPorts: {
          '25565/tcp': {},
          '25575/tcp': {},
        },
      },
      HostConfig: {
        NetworkMode: 'mockMode',
      },
      NetworkSettings: {
        Networks: {},
      },
    });

    expect(config.HostConfig.Binds).toEqual([]);
  });
});
