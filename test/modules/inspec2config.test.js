const { containerInspect2Config, volumeInspect2Config } = require('../../src/modules/inspect2config');

describe('containerInspect2Config', () => {
  it('should parse the inspection result into a config', () => {
    const config = containerInspect2Config({
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
    const config = containerInspect2Config({
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
    const config = containerInspect2Config({
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
    const config = containerInspect2Config({
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
    const config = containerInspect2Config({
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

describe('volumeInspect2Config', () => {
  const config = volumeInspect2Config({
    CreatedAt: '2019-05-18T09:59:26Z',
    Driver: 'local',
    Labels: null,
    Mountpoint: '/var/lib/docker/volumes/nfs-mount/_data',
    Name: 'nfs-mount',
    Options: {
      device: ':/volume1/main',
      o: 'addr=127.0.0.1,rw,noatime,rsize=8192,wsize=8192,tcp,timeo=14',
      type: 'nfs4',
    },
    Scope: 'local',
  });

  expect(config).toEqual({
    Name: 'nfs-mount',
    Driver: 'local',
    DriverOpts: {
      device: ':/volume1/main',
      o: 'addr=127.0.0.1,rw,noatime,rsize=8192,wsize=8192,tcp,timeo=14',
      type: 'nfs4',
    },
    Labels: null,
  });
});
