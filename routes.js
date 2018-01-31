var moment = require('moment');
var db = require('./database.js');
var con = db.connection;
var settings = require('./settings').system_settings;
var admin = require('./admin.js');



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
					data: resultsTeacher,
					teacherName: resultsTeacher[0].prefix + " " + resultsTeacher[0].teacherName,
				});
			} else {
				res.send("not valid teacher id!");
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
							
							if (moment(dayResults[i].day).subtract(settings["hours_close_teacher"].value_int,'hours').isBefore()){
								dayResults[i]['canEdit'] = false;
								
							}else{
								dayResults[i]['canEdit'] = true;
							}
							dayResults[i].day = moment(dayResults[i].day).format('MM-DD');
							dayResults[i].set = dayResults[i].set == offering_uid ? 1 : 0;
						}
						res.render('offeringEdit.html', {
							data: offeringInfo,
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

	app.get('/delete/:id', function(req, res) {
		var offering_uid = req.params.id;
		con.query('delete from offerings where uid_offering = ?', [offering_uid], function(err) {
			if (err) {
				console.log(err);
			} else {
				res.render("/");
			}
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

		con.query('select uid_offering from offerings where uid_teacher = ?;', [teacherId], function(err,offerings) {
			for (var d = 0; d < days.length; d++) {	
				for (var o = 0; o < offerings.length; o++) {
					console.log(offerings[o].uid_day);
					console.log(days[d]);
					con.query('delete from calendar where uid_offering = ? and uid_day = ?;', [offerings[o], days[d]], function(err,result) {
						if(err){
							console.log(err);
						}
						
						
					});
				}
				con.query('insert into calendar (uid_day, uid_offering) values (?,?);', [days[d], offering_id], function(err,result) {
				
						console.log(result);
					
				});

			}

		});



			
		



		
	});
	//UPDATE offerings SET name=?, description = ?, max_size = ?, recurring = ?, WHERE uid_offering=?;
	//
	app.get('/add/:id', function(req, res) {
		var teacher_uid = req.params.id;
		con.query('INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("", 0, ?, 0, "");', [teacher_uid], function(err) {
			if (!err) {
				con.query('select * from offerings where uid_offering = last_insert_id();', function(err, offeringInfo) {
					if (!err) {
						var offering_uid = offeringInfo[0].uid_offering;
						res.render('offeringEdit.html', {
							data: offeringInfo,
							offeringId: offering_uid
						});
					} else {
						res.send("Oh shit!");
					}
				});
			} else {
				res.send("not valid offering id!");
			}
		});
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
