'use strict';
const moment = require('moment');

module.exports = moduleA;

function moduleA() {
    console.log('ModuleA hello, creating moment');
    return moment();
    // TODO
}
