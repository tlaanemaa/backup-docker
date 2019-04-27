const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

// Custom enum factory
const enumOf = (options = []) => function Enum(value) {
  if (!options.includes(value)) {
    throw new Error(`Invalid value: ${value}. Available options are: ${JSON.stringify(options)}`);
  }
  return value;
};

// Command line argument options
const optionDefinitions = [
  {
    name: 'operation',
    type: enumOf(['backup', 'restore']),
    defaultOption: true,
    description: 'Operation to perform, either backup or restore',
  },
  {
    name: 'containers',
    alias: 'c',
    type: String,
    multiple: true,
    defaultValue: [],
    description: 'Optional names of the containers to backup or restore. Defaults to all containers',
  },
  {
    name: 'directory',
    alias: 'd',
    type: String,
    defaultValue: process.cwd(),
    description: 'Optional directory name to save to or look for container backups. Defaults to current working directory',
  },
  {
    name: 'socketPath',
    alias: 's',
    type: String,
    description: 'Optional Docker socket path. Defaults to /var/run/docker.sock',
  },
  {
    name: 'only',
    alias: 'o',
    type: enumOf(['containers', 'volumes']),
    description: 'Optional to indicate that operation should only happen with containers or volumes. Defaults to both',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Prints this help page',
  },
];

// Usage text
const usage = commandLineUsage([
  {
    header: 'Backup Docker',
    content: 'A simple command line tool to backup and restore docker containers along with their volumes',
  },
  {
    header: 'Synopsis',
    content: 'backup-docker <backup|restore> -c [<container-name, container-name, ...>]',
  },
  {
    header: 'Options',
    optionList: optionDefinitions,
  },
]);

// Parse args and handle errors
const parseArgs = () => {
  try {
    const args = commandLineArgs(optionDefinitions);

    // Print help if needed
    if (args && args.help) {
      // eslint-disable-next-line no-console
      console.log(usage);
      process.exit(0);
    }

    // Throw error if no operation is provided
    if (!args.operation) {
      throw new Error('Operation name must be provided!');
    }

    return args;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e.message, '\nUse the --help option to see docs');
    process.exit(1);
    throw (e);
  }
};

module.exports = parseArgs();
