const { createLogger, format, transports } = require( 'winston');

const baseFormat = format.combine(
  format.timestamp(),
  format.printf(({ timestamp, level, message, module }) => {
    return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
  })
);

function createModuleLogger(moduleName, fileName) {
  return createLogger({
    level: 'debug',
    format: baseFormat,
    transports: [
      new transports.File({ filename: `logs/${fileName}` }),
      new transports.Console()
    ],
    defaultMeta: { module: moduleName }
  });
}

const coreLogger = createModuleLogger('CORE', 'core.log');
const moduleLogger = (module) => createModuleLogger(module, 'modules.log');
const interfaceLogger = (module) => createModuleLogger(module, 'interfaces.log');
const taskLogger = createModuleLogger('TASK', 'tasks.log');

module.exports = {
  coreLogger,
  moduleLogger,
  interfaceLogger,
  taskLogger
};