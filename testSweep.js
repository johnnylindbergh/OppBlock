var mysql = require('mysql');
var db = require('./database.js');
var con = db.connection;
var Chance = require('chance');

var chance = new Chance();



function opp_block_day(n, callback){

	for (var i = 0; i < n; i++){
		var day = chance.date(); 
		console.log(day);
		con.query('insert into opp_block_day (day) values (?);',[day],function(err){
			if (err){
				console.log(err);
			}
		});
	}
	callback();
}

function teachers_offerings(teachers, offeringsPerTeacher, callback){

	con.query('select uid_day from opp_block_day;', function(err, days){
		if (!err){
			console.log(days);
			for (var i = 0; i < teachers; i++){
				var prefix = chance.prefix();
				var lastname = chance.first();
				var firstname = chance.last();
				var email = chance.email();
		
				con.query('insert into teachers (prefix, teacher_lastname, teacher_firstname, teacher_email) values (?,?,?,?);',[prefix, lastname, firstname, email],function(err, res){
					if (!err){
						for (var j = 0; j < offeringsPerTeacher; j++){
							var name = chance.sentence({words: 3});
							var location = chance.street();
							var description = chance.paragraph({sentences: 2});
							var max_size = chance.integer({min: 2, max: 40});
							uid_teacher = res.insertId;
							con.query('insert into offerings (name, location, description, max_size, uid_teacher) values (?,?,?,?,?);',[name, location, description, max_size, uid_teacher],function(err, res){
								if (!err){
									var uid_offering = res.insertId; 
									var numberOfdays = Math.floor(Math.random()*5);
									for (var k = 0; k < numberOfdays; k++){
										var day = Math.floor(Math.random()*days.length);
										con.query('insert ignore into calendar (uid_day, uid_offering) values (?,?);', [days[day].uid_day, uid_offering], function(err){
											if (err){
												console.log(err);
											}
										})
									}
									console.log(numberOfdays);
	
								}
							});
						}
	
					}
				});
			}
		}
		callback();

	});

	
}

function students(numberOfStudents, callback){
	for (var s = 0; s < numberOfStudents; s++){
		var lastname = chance.first();
		var firstname = chance.last();
		var grade = Math.floor(Math.random()*4.0)+9;
		var email = chance.email();
		con.query('insert into students (lastname,firstname,grade,email) values (?,?,?,?);', [lastname, firstname, grade, email], function(err){
			if (err){
				console.log(err);
			}
		});
	}
	callback();
}

