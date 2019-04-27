const commandLineArgs = jest.fn().mockImplementation(options => options.reduce(
  (acc, option, i) => {
    const arg = commandLineArgs.args[i];
    if (arg) {
      acc[option.name] = option.type(arg);
    }
    return acc;
  },
  {},
));

commandLineArgs.args = [];

module.exports = commandLineArgs;
