const parseArgs = require('minimist');

// Parse args
const args = parseArgs(process.argv.slice(2), {
  boolean: ['containersOnly', 'volumesOnly', 'help'],
  default: {
    directory: process.cwd(),
    socketPath: null,
  },
});

module.exports = args;
