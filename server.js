var mysql = require('mysql');
var moment = require('moment');
var express = require('express');
var app = express();
var con = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'opp_block'
});
con.connect();

function test() {
	con.query('SELECT day from opp_block_day', function(err, rows, fields) {
		if (!err) {
			console.log('\nOppBlock days:')
			for (var i in rows) {
				var day = rows[i]["day"];
				console.log('\t' + moment(day).format('dddd MMMM Do, YYYY [at] h:mm'));
			}
		} else {
			console.log('Error, are you sure you ran CREATE_DB.sql?');
		}
	});
}

function createOffering(name, maxSize, location, materials, recurring, teacherName, uidTeacher, DayArray) {
	var i = getUid();
	if (uidTeacher == null) {
		con.query('SELECT uid_teacher FROM teachers WHERE name=?', [teacherName], function(err, results) {
			results = results[0];
			var uidTeacher = results.uid_teacher;
			console.log(uidTeacher);
			con.query('INSERT into offerings (name, max_size, location, materials, uid_teacher, recurring) values (?,?,?,?,?,?);', [name, maxSize, location, materials, uidTeacher, recurring], function(err, results) {
				OppBlockCalendar(name, DayArray, recurring);
			});
		});
	} else {
		con.query('INSERT into offerings (name, max_size, location, materials, uid_teacher, recurring) values (?,?,?,?,?,?);', [name, maxSize, location, materials, uidTeacher, recurring], function(err, results) {
			OppBlockCalendar(name, DayArray, recurring)
		});
	}
}

function OppBlockCalendar(name, DayArray, recurring) {
	if (!recurring) {
		con.query('SELECT uid_offering FROM offerings WHERE name=?', [name], function(err, results) {
			console.log(DayArray[i]);
			console.log(results);
			results = results[0];
			var uidOffering = results.uid_offering;
			console.log(uidOffering);
			for (var i = 0; i < DayArray.length; i++) {
				con.query('INSERT into calendar (uid_day, uid_offering) values (?,?);', [DayArray[i], uidOffering]);
			}
		});
	}
}







function getUidFromValue(tableType, value, callback) {
	if (tableType == "teachers"){
		con.query('SELECT uid_teacher FROM teachers WHERE name = ?', [value], function(err, results) {
			callback(results[0].uid_teacher)       
		});
	}

	if (tableType == "students"){
		con.query('SELECT uid_student FROM students WHERE name = ?', [value], function(err, results) {
			callback(results[0].uid_student)       
		});
	}

	if (tableType == "opp_block_day"){
		value = moment(value).format('YYYY-MM-DD');
		console.log("formatted: "+value);
		con.query('SELECT uid_day FROM opp_block_day WHERE day = ?', [value], function(err, results) {
			callback(results[0].opp_block_day)       
		});
	}

}

getUidFromValue("opp_block_day", "august 20 1999 2:00", function(res){
	console.log("this:"+res+".");
});





//createOffering("newOppBlock", 2, "The CS Lab", "nothing", false, "Mr. Minster", null, [1, 2, 4]);
var server = app.listen(8080, function() {
	console.log('OppBlock server listening on port %s', server.address().port);
});