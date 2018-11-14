'use strict';


module.exports = function(rabbit, qData) {
    rabbit.consume(qData.name, qData.maxUnackMessages, handleMessage);
};

function handleMessage(message, error, done) {
    var type = message.type,
        subtype = message.subtype;

    if (type && subtype && actions[type] && actions[type][subtype]) return actions[type][subtype](message, error, done);
    if (actions[type]) return actions[type](message, error, done);
    console.log('CRON TYPE ' + type + ' IS MISSING');
    done();
}

var actions = {
    //2d174224b96cdf6b48faeb6e29ef5ec787168225122893f7de783c0def166ba8
    reindex: function(message, error, done) {
        require('../crons/reindex')(message, error, done);
    },
    //0f209e3b84ab3fc6656767bd4770166aff2913181713b094636be1552e0ce69eca1f23a11be18dea5add45758ac3ba6c
    cleanVirtualNumbers: function(message, error, done) {
        require('../crons/clean-virtuals-numbers')(message, error, done);
    },
    //31fb5d3d13f99f98b1c2676386d01a705099b1dc589895098c9b44a867923c8a
    sitemap: function(message, error, done) {
        require('../crons/sitemap')(message, error, done);
    },
    //fafe7ca1505898a230b929e3ee0a1a3409e25b8e3f73d647bd3c4e646785f95d
    convert2geo: function(message, error, done) {
        require('../crons/convert2geo')(message, error, done);
    },
};