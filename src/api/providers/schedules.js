'use strict';

var config = require('../config');

module.exports = function(db) {
    for (var i = 0; config.schedules && i < config.schedules.length; i++) {
        var Ctrl = require(config.schedules[i].name);
        var ctrl = new Ctrl();
        if (ctrl.scheduler) ctrl.scheduler(config.schedules[i].cron, db);
    }
}