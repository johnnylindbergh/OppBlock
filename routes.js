var db = require('./database.js');
var con = db.connection;
var settings = db.system_settings;
var moment = require('moment');


module.exports = function(app) {



	app.get('/', function(req, res) {
		//session.startSession(req, res);
		// req.session.put('info', 'myInfo', function(req,res){
		console.log(req.body.idtoken);
		res.render('login.html');
		// });
	});

	app.get('/teacher/:id', isTeacher, function(req, res) {
		var teacher_uid = req.params.id;
		req.user.teacher_uid = teacher_uid;
		con.query('select teachers.uid_teacher, teachers.prefix, teachers.name as teacherName, offerings.name as offeringName, offerings.uid_offering, offerings.description, offerings.max_size, offerings.recurring from teachers inner join offerings ON teachers.uid_teacher=offerings.uid_teacher where teachers.uid_teacher = ?;', [teacher_uid], function(err, resultsTeacher) {
			if (resultsTeacher.length != 0) {
				res.render('teacher.html', {
					data: resultsTeacher,
					teacherName: resultsTeacher[0].prefix + " " + resultsTeacher[0].teacherName,
				});
			} else {
				con.query('select * from teachers where uid_teacher = ?;', [teacher_uid], function(err, resultsTeacher) {
					console.log(resultsTeacher);
					 res.render('teacher.html', {					 	
					 	teacherName: resultsTeacher[0].prefix + " " + resultsTeacher[0].teacherName,
					 });
				});
			}
		});
	});

	app.get('/editOffering/:id', function(req, res) {
		var teacher_uid = req.user.teacher_uid;
		var offering_uid = req.params.id;
		con.query('select * from offerings where uid_offering = ?;', [offering_uid], function(err, offeringInfo) {
			if (!err) {
				con.query('select opp_block_day.uid_day, opp_block_day.day, calendar.uid_offering as "set" from opp_block_day left join calendar on opp_block_day.uid_day=calendar.uid_day and calendar.uid_offering = ? order by opp_block_day.day;', [offering_uid], function(err, dayResults) {
					if (!err) {
						for (var i = 0; i < dayResults.length; i++) {
							console.log(settings.hours_close_teacher.value_int);
							if (moment(dayResults[i].day).add(settings.hours_close_teacher.value_int,'hours').isBefore()){
								dayResults[i]['canEdit'] = false;
								
							}else{
								dayResults[i]['canEdit'] = true;
							}
							
							dayResults[i].day = moment(dayResults[i].day).format('MM-DD');
							dayResults[i].set = dayResults[i].set == offering_uid ? 1 : 0;
						}
						res.render('offeringEdit.html', {
							data: offeringInfo,
							offeringIdUpdate: offering_uid,
							offeringId: offering_uid,
							dayData: dayResults
						});
					}
				});
			} else {
				res.send("not valid offering id!");
			}
		});
	});

	app.get('/delete/:id/', function(req, res) {
		var offering_uid = req.params.id;
		var teacher_uid = req.user.teacher_uid;
		con.query('delete from calendar where uid_offering = ?;', [offering_uid], function(err,result) {
			con.query('delete from offerings where uid_offering = ?', [offering_uid], function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log(teacher_uid);
					res.redirect("/teacher/");
				}
			});
		});
	});

	app.post('/updateOffering/:offering_id/', function(req, res) {
		var offering_id = req.params.offering_id;
		var name = req.body.name;
		var description = req.body.description;
		var max_size = parseInt(req.body.max_size);
		var teacherId = req.user.teacher_uid;
		var recurring = req.body.recurring == 'on' ? 1 : 0;

		var days = req.body.days;
		
			con.query('delete from calendar where uid_offering = ?;', [offering_id], function(err,result) {});
	
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
	app.get('/add/', function(req, res) {
		var teacher_uid = req.user.teacher_uid;
		con.query('INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("", 0, ?, 0, "");', [teacher_uid], function(err) {
			if (!err) {
				con.query('select * from offerings where uid_offering = last_insert_id();', function(err, offeringInfo) {
					res.redirect('/editOffering/'+offeringInfo[0].uid_offering);
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
			res.render('attendance.html',{students: students, uid_offering: offering});
		});

	});

	app.post('/updateAttendance/:offering', function(req,res){
		console.log(req.params.offering);
		res.end(JSON.stringify(req.body.students));
		var students = req.body.students;
		for (var i = 0; i <students.length;i++ ){
			con.query('update students set arrived = 1 where uid_student = ?',[students[i]], function(err){
				console.log(err);
			});

		}

	});

	//CSV Post
	app.post('/studentcsvinput', function(req,res) {
		if (res != undefined){
			admin.createStudentCSV(req.body.Rad);
			res.redirect('/admin');
		}
	});

	app.post('/teachercsvinput', function(req, res) {
		if (res != undefined){
			admin.createTeacherCSV(req.body.Radical);
			res.redirect('/admin');
		}
	});

	app.get('/csvinput', function(req,res) {
		res.render('clientcsv.html', {
		});
	});


	app.get('/Day/:id', function(req, res) {
		var day_uid = req.params.id;
			con.query('select * from offerings;', function(err, resultsDay) {
				var link=resultsDay[0].uid_teacher;
				//console.log(link);
				con.query('select name from teachers where uid_teacher=?;',[link], function(err, resultName){
				
				//console.log(resultsDay);
				
				res.render('Day.html', { 
				data:resultsDay,
				Teacher:resultName.name
				
				});
			});
			
			
		});	
	});
	
	app.get('/Offeringstudents/:id', function(req, res){
		var teacher_uid = req.params.id;
		//console.log(teacher_uid);
		con.query('select uid_offering from offerings where uid_teacher=?;',[teacher_uid], function(err, resultsO){
			var off=resultsO[0].uid_offering;
			//console.log(off);
			con.query('select uid_student from choices where uid_offering=?;', [off], function(err, resultsS){
				
				var stud=resultsS[0].uid_student;
				
				con.query('select lastname from students where uid_student=?;',[stud], function(err, resultsZ){
				con.query('select name from teachers where uid_teacher=?;', [teacher_uid], function(err, resultsN){
				console.log(resultsN);
				res.render('Offeringstudents.html',{
				name:resultsN[0].name,
				data:resultsZ
				});
			});
			});
		});
	});
	});



	app.get('/Admin', function(req, res){
		con.query('select * from opp_block_day;', function(err, resultsAdmin){
				console.log(resultsAdmin);
				res.render('Admin.html',{
				
				data:resultsAdmin
				});
			
		});
	});
	

	//need to join those uid students with student names
	app.get('/Mopblock', function(req, res){
		con.query('select * from absent;', function(err, resultsMopblock){
				console.log(resultsMopblock);
				res.render('Mopblock.html',{
				data:resultsMopblock
			});
			
		});
	});
	//need to access stuff from choices table idk how
}
