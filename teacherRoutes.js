var moment = require('moment');
var db = require('./database.js');
var con = db.connection;
var settings = db.system_settings;



module.exports = function(app) {


	app.get('/', function(req, res) {
		//session.startSession(req, res);
		// req.session.put('info', 'myInfo', function(req,res){
		console.log(req.body.idtoken);
		res.render('login.html');
		// });
	});

	app.get('/teacher/:id', function(req, res) {
		var teacher_uid = req.params.id;
		con.query('select teachers.uid_teacher, teachers.prefix, teachers.name as teacherName, offerings.name as offeringName, offerings.uid_offering, offerings.description, offerings.max_size, offerings.recurring from teachers inner join offerings ON teachers.uid_teacher=offerings.uid_teacher where teachers.uid_teacher = ?;', [teacher_uid], function(err, resultsTeacher) {
			if (resultsTeacher.length != 0) {
				res.render('teacher.html', {
					teacherId:teacher_uid,
					data: resultsTeacher,
					teacherName: resultsTeacher[0].prefix + " " + resultsTeacher[0].teacherName,
				});
			} else {
				con.query('select * from teachers where uid_teacher = ?;', [teacher_uid], function(err, resultsTeacher) {
					console.log(resultsTeacher);
					 res.render('teacher.html', {
					 	teacherId:teacher_uid,
					 	
					 	teacherName: resultsTeacher[0].prefix + " " + resultsTeacher[0].teacherName,
					 });
				});
			}
		});
	});

	app.get('/editOffering/:id/:teacher_id', function(req, res) {
		var teacher_uid = req.params.teacher_id;
		var offering_uid = req.params.id;
		con.query('select * from offerings where uid_offering = ?;', [offering_uid], function(err, offeringInfo) {
			if (!err) {
				con.query('select opp_block_day.uid_day, opp_block_day.day, calendar.uid_offering as "set" from opp_block_day left join calendar on opp_block_day.uid_day=calendar.uid_day and calendar.uid_offering = ? order by opp_block_day.day;', [offering_uid], function(err, dayResults) {
					if (!err) {
						for (var i = 0; i < dayResults.length; i++) {
							
							if (moment(dayResults[i].day).subtract(settings.hours_close_teacher.value_int,'hours').isBefore()){
								dayResults[i]['canEdit'] = false;
								
							}else{
								dayResults[i]['canEdit'] = true;
							}
							
							dayResults[i].day = moment(dayResults[i].day).format('MM-DD');
							dayResults[i].set = dayResults[i].set == offering_uid ? 1 : 0;
						}
						res.render('offeringEdit.html', {
							data: offeringInfo,
							teacherIdDelete: teacher_uid,
							offeringIdUpdate: offering_uid,
							offeringId: offering_uid,
							teacherId:teacher_uid,
							dayData: dayResults
						});
					}
				});
			} else {
				res.send("not valid offering id!");
			}
		});
	});

	app.get('/delete/:id/:teacher_uid', function(req, res) {
		var offering_uid = req.params.id;
		var teacher_uid = req.params.teacher_uid;
		con.query('delete from calendar where uid_offering = ?;', [offering_uid], function(err,result) {
			con.query('delete from offerings where uid_offering = ?', [offering_uid], function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log(teacher_uid);
					res.redirect("/teacher/" + teacher_uid);
				}
			});
		});
	});

	app.post('/updateOffering/:offering_id/:teacher_id', function(req, res) {
		var offering_id = req.params.offering_id;
		var name = req.body.name;
		var description = req.body.description;
		var max_size = parseInt(req.body.max_size);
		var teacherId = parseInt(req.params.teacher_id);
		var recurring = req.body.recurring == 'on' ? 1 : 0;

		var days = req.body.days;
		if (!Array.isArray(days)){days = [days];}
		for (var i = 0; i < days.length; i++) {if(days[i] != undefined){days[i] = parseInt(days[i])}else{days = []}}

		if (recurring == 1) {
			con.query('UPDATE offerings SET recurring = 0  WHERE recurring = 1 and  uid_teacher = ? and uid_offering !=? ;', [uid_teacher[0].uid_teacher, offering_id], function(err) {
				if (err) {
					console.log(err);
				}
			});
		}	

		con.query('UPDATE offerings SET name = ?, description = ?, max_size = ?, recurring = ? WHERE uid_offering = ?;', [name, description, max_size, recurring, offering_id], function(err) {
			if (err) {
				console.log(err);
			} else {
				res.redirect("/teacher/" + teacherId);
			}
		});
		for (var d = 0; d < days.length; d++) {	
				con.query('insert into calendar (uid_day, uid_offering) values (?,?);', [days[d], offering_id], function(err,result) {
					if (err){
						console.log(err);
					}				
			});
		}



		
	});
	//UPDATE offerings SET name=?, description = ?, max_size = ?, recurring = ?, WHERE uid_offering=?;
	//
	app.get('/add/:id', function(req, res) {
		var teacher_uid = req.params.id;
		con.query('INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("", 0, ?, 0, "");', [teacher_uid], function(err) {
			if (!err) {
				con.query('select * from offerings where uid_offering = last_insert_id();', function(err, offeringInfo) {
					res.redirect('/editOffering/'+offeringInfo[0].uid_offering+'/'+teacher_uid);
				});
			} else {
				res.send("not valid offering id!");
			}
		});
	});

	app.get('/attendance/:offering', function(req, res) {
		var offering = req.params.offering;

		var uid_day = 1;//theres a function for this somewhere
		con.query('select * from choices inner join students on choices.uid_student = students.uid_student and uid_offering = ? and uid_day = ?', [offering, uid_day], function(err, students) {
			console.log(students);
			res.render('attendance.html',{students: students});
		});

	});

}

