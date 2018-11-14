var auth = require('../auth');
var config = require('../config');

process.stdin.resume();
process.stdout.write('Please enter cron type (and "-subtype") ');
process.stdin.once("data", function(data) {
    var str = config.tokenSecret + '-' + data.toString().trim();
    console.log(auth.encrypt(str));
    process.exit();
});