var moment = require('moment');
var db = require('./database.js');
var con = db.connection;
var settings = db.system_settings;



module.exports = function(app) {

	app.get('/student/:id', function(req, res) {
		var student_id = req.params.id;
		res.render('student.html');
	});


}
