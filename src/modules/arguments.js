const path = require('path');
const parseArgs = require('minimist');

// Parse args
const args = parseArgs(process.argv.slice(2), {
  boolean: ['containerOnly', 'volumesOnly'],
  default: {
    directory: process.cwd(),
    socketPath: null,
  },
});

module.exports = args;
