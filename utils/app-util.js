const crypto = require('crypto');
const log = require('./logger')
function getArgs() {
    log.info(`Start function getArgs.`);
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach(arg => {
            // long arg
            if (arg.slice(0, 2) === '--') {
                const longArg = arg.split('=');
                const longArgFlag = longArg[0].slice(2, longArg[0].length);
                const longArgValue = longArg.length > 1 ? longArg[1] : false;
                args[longArgFlag] = longArgValue;
            }
        });
        log.info(`End function getArgs.`);
    return args;
}
//const args = getArgs();



function makeOneTimeCode() {
    log.info(`Start function makeOneTimeCode.`);
    const digits = '0123456789';
    let OneTimeCode = '';
    for (let i = 0; i < 8; i++) {
        OneTimeCode += digits[Math.floor(Math.random() * 10)];
    }

    let confirmTokenExpires = new Date();
    // confirmTokenExpires.setTime(confirmTokenExpires.getTime() + (48 * 60 * 60 * 1000)); //48 hours
    confirmTokenExpires.setTime(confirmTokenExpires.getTime() + (5 * 60 * 1000)); //5 min
    confirmTokenExpires = confirmTokenExpires.toISOString();
    log.info(`End function makeOneTimeCode. DATA: ${JSON.stringify({ OneTimeCode, confirmTokenExpires})}`);
    return {
        OneTimeCode,
        confirmTokenExpires
    };
}

function makeLocalToken() {
    log.info(`Start function makeLocalToken.`);
    const buf = crypto.randomBytes(32);
    const confirmToken = buf.toString('hex');
    let confirmTokenExpires = new Date();
    confirmTokenExpires.setTime(confirmTokenExpires.getTime() + (48 * 60 * 60 * 1000)); //48 hours
    confirmTokenExpires = confirmTokenExpires.toISOString();
    log.info(`End function makeLocalToken. DATA: ${JSON.stringify({confirmToken ,confirmTokenExpires})}`);
    return {
        confirmToken,
        confirmTokenExpires
    };
}


module.exports = {
    getArgs,
    makeOneTimeCode,
    makeLocalToken
};
