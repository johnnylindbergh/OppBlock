var express = require('express');
var app = express();
var mustacheExpress = require('mustache-express');
var credentials = require("./credentials.js");
var con = require('./database.js');
var settings = require("./settings.js").init();
var moment = require('moment');
var getClosest = require("get-closest");
var Levenshtein = require("levenshtein");
var https = require('https');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.engine('html', mustacheExpress());
app.set('views', __dirname + '/views');

var routes = require('./routes.js')(app);
var student = require("./student.js");
var admin = require("./admin.js").init(app);

var server = app.listen(8080, function() {
    console.log('OppBlock server listening on port %s', server.address().port);
});

