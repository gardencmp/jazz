import winston from "winston";

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${level}: [${timestamp}] ${message}`;
});

const logger = winston.createLogger({
    level: "debug",
    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        customFormat,
    ),
    transports: [new winston.transports.Console()],
    silent: false,
});

export default logger;
