'use strict';

const moduleA = require('modulea');
const moment = require('moment');
module.exports = moduleB;

function moduleB() {
    console.log('ModuleB getting moment from ModuleA');
    const moduleAMoment = moduleA();
    const localMoment = moment();
    console.log(`Is momentA moment same as momentB moment? ${ moduleAMoment instanceof moment }`);
    console.log(`Is local moment instance of moment? ${ localMoment instanceof moment }`);
    console.log(`Time is: ${moduleAMoment.format()}`);
}

moduleB();
