var express = require('express');
var app = express();
var mustacheExpress = require('mustache-express');
var bodyParser = require('body-parser');
var credentials = require("./credentials.js");
var con = require('./database.js');
var moment = require('moment');
var getClosest = require("get-closest");
var Levenshtein = require("levenshtein");
var https = require('https');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.engine('html', mustacheExpress());
app.set('views', __dirname + '/views');

con.init();	//initialize system settings

var teacherRoutes = require('./routes.js')(app);
var student = require("./student.js");
var admin = require("./admin.js").init(app);

var server = app.listen(8080, function() {
    console.log('OppBlock server listening on port %s', server.address().port);
});

