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

function createOffering(name, maxSize,  description, recurring, teacherName, uidTeacher, DayArray) {
	if (uidTeacher == null) {
		getUidFromValue('teachers', teacherName, function(uidTeacher){
			con.query('INSERT into offerings (name, max_size, description, uid_teacher, recurring) values (?,?,?,?,?);', [name, maxSize, description, uidTeacher, recurring], function(err, results) {
				OppBlockCalendar(name, DayArray, recurring);
			});
		});
	} else {
		con.query('INSERT into offerings (name, max_size, description, uid_teacher, recurring) values (?,?,?,?,?);', [name, maxSize, description, uidTeacher, recurring], function(err, results) {
			OppBlockCalendar(name, DayArray, recurring)
		});
	}
}

function OppBlockCalendar(name, DayArray, recurring) {
	if (!recurring) {
		if (DayArray != null){
			getUidFromValue('offerings', name, function(uid){
				for (var i = 0; i < DayArray.length; i++) {
					console.log("uid: "+uid+"  day:  "+ DayArray[i]);
					con.query('INSERT into calendar (uid_day, uid_offering) values (?,?);', [DayArray[i], uid]);
				}
			});
		}
	}
}







function getUidFromValue(tableType, value, callback) {
	if (tableType == "teachers"){
		con.query('SELECT uid_teacher FROM teachers WHERE name = ?', [value], function(err, results) {
			if (results.length > 0){
				callback(results[0].uid_teacher);
			}else{
				callback(null); 
			}    
		});
	}

	if (tableType == "students"){
		con.query('SELECT uid_student FROM students WHERE name = ?', [value], function(err, results) {
			if (results.length > 0){
				callback(results[0].uid_student);
			}else{
				callback(null); 
			}    
		});
	}

	if (tableType == "opp_block_day"){
		valueFormatted = moment(value).format('YYYY-MM-DD');
		con.query('SELECT uid_day FROM opp_block_day WHERE day = ?', [valueFormatted], function(err, results) {
			if (results.length > 0){
				callback(results[0].uid_day);  
			}else{
				callback(null); 
			}     
		});
	}

	if (tableType == "offerings"){
		con.query('SELECT uid_offering FROM offerings WHERE name = ?', [value], function(err, results) {
			if (results.length > 0){
				callback(results[0].uid_offering);  
			}else{
				callback(null); 
			}     
		});
	}

}

// getUidFromValue("opp_block_day", "08/20/1999", function(res){
// 	console.log("this:"+res+".");
// });





createOffering("newOppBlock", 2, "this is the opp block description", false, null, 1, null);

var server = app.listen(8080, function() {
	console.log('OppBlock server listening on port %s', server.address().port);
});