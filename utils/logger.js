import { createLogger, format, transports } from 'winston';

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

export const coreLogger = createModuleLogger('CORE', 'core.log');
export const commandLogger = createModuleLogger('COMMAND', 'commands.log');
export const interfaceLogger = createModuleLogger('INTERFACE', 'interface.log');
export const taskLogger = createModuleLogger('TASK', 'tasks.log');