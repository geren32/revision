const winston = require('winston'),
    format = winston.format;

const transformer = format((info) => {
    if (info.meta && info.meta instanceof Error) {
        info.meta = {
            message: info.meta.message,
            stack: info.meta.stack
        };
    }
    return info;
})();
const logger = winston.createLogger({
    level: 'info',
    format: format.combine(
        // To handle % references in message
        format.splat(),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss,SS'
        }),
        // Handle error objects
        transformer,
        format.json()
        //options.console !== 'text' ?
            //format.json() :
            /*format.printf((info) => {
                const {
                        timestamp, level, message,
                        ...args
                    } = info,
                    len = Object.keys(args).length;
                if (args.meta && args.meta.stack) {
                    // Handle stack trace
                    return `${timestamp} ${level}: ${message} ${args.meta.stack}`;
                } else if (len > 0) {
                    // Handle metadata
                    return `${timestamp} ${level}: ${message} ${JSON.stringify(args)}`;
                }
                return `${timestamp} ${level}: ${message}`;
            })*/
    ),
    transports: [ new winston.transports.Console({
        level: 'info',
        handleExceptions: true,
        silent: true
    }) ],
});

module.exports = logger;
