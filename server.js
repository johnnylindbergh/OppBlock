var express = require('express');
var app = express();
var mustacheExpress = require('mustache-express');
var bodyParser = require('body-parser');
var credentials = require("./credentials.js");
var con = require('./database.js');
var settings = require("./settings.js").init();
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

var admin = require("./admin.js").init(app);
<<<<<<< HEAD
var teacherRoutes = require('./teacherRoutes.js')(app);
var student = require("./student.js");
var student = require("./studentRoutes.js")(app);
=======
var routes = require('./routes.js')(app);
var student = require("./student.js").init(app);
>>>>>>> d6b21adeff6fc82e39e20458b9714a9f247417bf


var server = app.listen(8980, function() {
    console.log('OppBlock server listening on port %s', server.address().port);
});

