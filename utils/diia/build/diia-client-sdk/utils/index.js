"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumeric = exports.genUrlParams = exports.prettyJson = exports.log = void 0;
const log = function (msg) {
    if (process.env.LOGGING === 'true') {
        console.log('===LOGGING=== ', msg);
    }
};
exports.log = log;
const prettyJson = function (data) {
    return JSON.stringify(data, null, 2);
};
exports.prettyJson = prettyJson;
const genUrlParams = function (skip, limit) {
    let urlParams = '';
    if ((0, exports.isNumeric)(skip) && (0, exports.isNumeric)(limit)) {
        urlParams += `?skip=${skip}&limit=${limit}`;
    }
    else if ((0, exports.isNumeric)(skip)) {
        urlParams += `?skip=${skip}`;
    }
    else if ((0, exports.isNumeric)(limit)) {
        urlParams += `?limit=${limit}`;
    }
    return urlParams;
};
exports.genUrlParams = genUrlParams;
const isNumeric = function (value) {
    return !isNaN(value - parseFloat(value));
};
exports.isNumeric = isNumeric;
