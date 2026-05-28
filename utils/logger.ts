import { createLogger, format, transports, Logger } from "winston";

const baseFormat = format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, module }) => {
        return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
    })
);

function createModuleLogger(
    moduleName: string,
    fileName: string
): Logger {
    return createLogger({
        level: "debug",
        format: baseFormat,
        transports: [
            new transports.File({
                filename: `logs/${fileName}`
            }),
            new transports.Console()
        ],
        defaultMeta: {
            module: moduleName
        }
    });
}

export const coreLogger = createModuleLogger(
    "CORE",
    "core.log"
);

export const moduleLogger = (
    module: string
): Logger => createModuleLogger(
    module,
    "modules.log"
);

export const interfaceLogger = (
    module: string
): Logger => createModuleLogger(
    module,
    "interfaces.log"
);

export const taskLogger = createModuleLogger(
    "TASK",
    "tasks.log"
);