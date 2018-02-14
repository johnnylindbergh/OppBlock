var db = require('./database.js');
var con = db.connection;
var settings = require('./settings.js').system_settings;
var moment = require('moment');
var middleware = require('./roles.js');
var admin = require('./admin.js');
var Levenshtein = require('levenshtein');
var getClosest = require('get-closest');
var PriorityQueue = require('priorityqueuejs');

module.exports = function(app) {



	app.get('/', function(req, res) {
		if (req.isAuthenticated()) {
			if (req.user.isAdmin) {
				res.redirect('/admin');
			} else if (req.user.isTeacher) {
				res.redirect('/teacher');
			} else {
				res.redirect('/student');
			}
		} else {
			res.redirect('/auth/google');
		}
	});


	app.get('/teacher', middleware.isTeacher, function(req, res){
		var uid_teacher = req.user.local.uid_teacher;
		var currentOffering;

		con.query('select * from opp_block_day join calendar on calendar.uid_day = opp_block_day.uid_day join offerings on offerings.uid_teacher = ? order by opp_block_day.day desc',[uid_teacher], function(err, resultsDay){
			if (!err){
				for (var i = 0; i < resultsDay.length; i++){

					currentOffering = resultsDay[0];
					if (moment(resultsDay[i].day).isBefore()){

						currentOffering = resultsDay[i];

						break;
					}
				}
				if (currentOffering != undefined){

					con.query('select * from choices join students on choices.uid_student = students.uid_student and choices.uid_day = ? and choices.uid_offering = ?',[currentOffering.uid_day, currentOffering.uid_offering], function(err, students){
						if (!err){
							con.query('select teachers.uid_teacher, teachers.teacher_firstname as first, teachers.teacher_lastname as last, offerings.name as offeringName, offerings.location as location, offerings.uid_offering, offerings.description, offerings.max_size, offerings.recurring from teachers inner join offerings ON teachers.uid_teacher=offerings.uid_teacher where teachers.uid_teacher = ?;', [uid_teacher], function(err, resultsTeacher) {
								if (!err && resultsTeacher !== undefined && resultsTeacher.length != 0) {
									res.render('teacher.html', {
										currentOffering:currentOffering,
										offeringId:currentOffering.uid_offering,
										offeringDay:currentOffering.uid_day,
										containsStudents: (students.length != 0) ,
										students:students,
										data: resultsTeacher,
										teacherName: resultsTeacher[0].first +" "+resultsTeacher[0].last,
									});
								} else {
									con.query('select * from teachers where uid_teacher = ?;', [uid_teacher], function(err, resultsTeacher) {
										if (!err && resultsTeacher !== undefined && resultsTeacher.length != 0) {
					 					res.render('teacher.html', {					 	
					 						teacherName: resultsTeacher[0].teacher_firstname + " " + resultsTeacher[0].teacher_lastname
					 					});
										} else {
											res.redirect('/error');
										}
									});
								}
							});
						}
					});
				} else {
					con.query('select teachers.uid_teacher, teachers.teacher_firstname as first, teachers.teacher_lastname as last, offerings.name as offeringName, offerings.location as location, offerings.uid_offering, offerings.description, offerings.max_size, offerings.recurring from teachers inner join offerings ON teachers.uid_teacher=offerings.uid_teacher where teachers.uid_teacher = ?;', [uid_teacher], function(err, resultsTeacher) {
								if (!err && resultsTeacher !== undefined && resultsTeacher.length != 0) {
									res.render('teacher.html', {
										data: resultsTeacher,
										teacherName: resultsTeacher[0].first + " " + resultsTeacher[0].last
									});
								} else {
									con.query('select * from teachers where uid_teacher = ?;', [uid_teacher], function(err, resultsTeacher) {
										if (!err && resultsTeacher !== undefined && resultsTeacher.length != 0) {
					 					res.render('teacher.html', {					 	
					 						teacherName: resultsTeacher[0].teacher_firstname + " " + resultsTeacher[0].teacher_lastname
					 					});
										} else {
											res.redirect('/error');
										}
									});
								}
							});
				}
			}
		});
	});

	app.get('/editOffering/:id/', middleware.isTeacher, function(req, res) {
		var offering_uid = req.params.id;
		var teacher_uid = req.user.local.uid_teacher;
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
							
							dayResults[i].day = moment(dayResults[i].day).format('dddd[, ] MMMM Do');
							dayResults[i].set = dayResults[i].set == offering_uid ? 1 : 0;
						}
						res.render('offeringEdit.html', {
							data: offeringInfo,
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

	app.get('/delete/:id', middleware.isTeacher, function(req, res) {
		var offering_uid = req.params.id;
		var teacher_uid = req.user.local.uid_teacher;
		con.query('delete from choices where uid_offering = ?', [offering_uid], function(err) {
			if (!err) {
				con.query('delete from calendar where uid_offering = ?;', [offering_uid], function(err) {
					if (!err) {
						con.query('delete from offerings where uid_offering = ?', [offering_uid], function(err) {
							if (!err) {
								res.redirect("/teacher");
								// TODO: Add 'deletion confirmed' flash message
							} else {
								res.render("error.html", {err: err});
							}
						});
					} else {
						res.render("error.html", {err: err});
					}
				});
			} else {
				res.render("error.html", {err: err});
			}
		});
	});

	app.post('/updateOffering/:offering_id/', middleware.isTeacher, function(req, res) {
		var offering_id = req.params.offering_id;
		var name = req.body.name;
		var location = req.body.location;
		var description = req.body.description;
		var max_size = parseInt(req.body.max_size);
		var teacherId = req.user.local.uid_teacher;
		var isNew = req.body.isNew;
		var days = req.body.days;
		if (days == undefined){days = []}

		if (isNew){
			con.query('INSERT into offerings (name, location, max_size, description, uid_teacher) values (?, ?, ?, ?, ?);', [name, location, max_size,  description, teacherId ], function(err) {
				if (!err) {
					con.query('select * from offerings where uid_offering = last_insert_id();', function(err, offeringInfo) {
						if (!err){
							offering_id = offeringInfo[0].uid_offering;
							for (var d = 0; d < days.length; d++) {	
								con.query('insert into calendar (uid_day, uid_offering) values (?,?);', [days[d], offering_id], function(err,result) {
									if (err){
										console.log(err);
									}else{
										
									}				
								});
							}
							res.redirect('/teacher');
						}else{
							cnsole.log(err);
						}
					});
				} else {
					res.send("not valid offering id!");
				}
			});

		} else {
			
			con.query('delete from calendar where uid_offering = ?;', [offering_id], function(err,result) {
				if (!Array.isArray(days)){days = [days];}
				for (var i = 0; i < days.length; i++) {if(days[i] != undefined){days[i] = parseInt(days[i])}else{days = []}}
					con.query('UPDATE offerings SET name = ?, location = ?, description = ?, max_size = ? WHERE uid_offering = ?;', [name, location, description, max_size, offering_id], function(err) {
						if (err) {
							console.log(err);
						} else {
							res.redirect("/teacher");
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
		}	
	});
	//UPDATE offerings SET name=?, description = ?, max_size = ?, recurring = ?, WHERE uid_offering=?;
	app.get('/locations/', function(req, res) { res.send(undefined)});

	app.get('/locations/:location/', middleware.isTeacher, function(req, res) {
		var location = req.params.location;


		var locationDigits = location.match("\\d+");

		var locations = new PriorityQueue(function(a, b) {
  			return b.distance - a.distance;
		});

		var closestLocations = [];
		if (location != undefined){
			con.query('select * from offerings join calendar on offerings.uid_offering = calendar.uid_offering join opp_block_day on opp_block_day.uid_day = calendar.uid_day join teachers on teachers.uid_teacher = offerings.uid_teacher', function(err,result){
				if (!err && result != undefined){
					for (var i = 0; i < result.length; i++){
						if (moment(result[i].day).isAfter()){
							
							result[i].day = moment(result[i].day).format('dddd[, ] MMMM Do');
							var distance = new Levenshtein(location, result[i].location).distance;

							var digits = result[i].location.match("\\d+");

							if (digits != null && locationDigits != null){
								if (digits[0] == locationDigits[0]){
									distance = distance-3 ;
								}
								if (digits[0] != locationDigits[0]){
									distance = distance+3 ;
								}
							}

							locations.enq({offering:result[i], distance:distance});
						}
					}
					
					while (locations.size()>0 && closestLocations.length < 6){
						var l = locations.deq();
						if (l.distance<5){
							closestLocations.push(l);
						}

					} 
					res.send(closestLocations);
				}
			});
		} else {
			res.send(undefined);
		}
		
	});

	app.get('/teacherCalOfferings/', middleware.isTeacher, function(req,res){
		var uid_teacher = req.user.local.uid_teacher;
		if (uid_teacher != undefined){
			con.query('select * from opp_block_day join calendar on calendar.uid_day = opp_block_day.uid_day join offerings on offerings.uid_teacher = ? order by opp_block_day.day desc',[uid_teacher], function(err, resultsDay){
				if (resultsDay != undefined){
					res.send(resultsDay);
				} 
			});
		}

	});

	app.get('/teacherCalDays/', middleware.isTeacher, function(req,res){
		con.query('select * from opp_block_day;', function(err, resultsDay){
			if (resultsDay != undefined){
				res.send(resultsDay);
			} 
		});
	});

	app.get('/add', middleware.isTeacher, function(req, res) {
		var teacher_uid = req.user.local.uid_teacher;
		con.query('select * from opp_block_day', function(err, dayResults) {
			if (!err && dayResults != undefined) {
				for (var i = 0; i < dayResults.length; i++) {
					if (moment(dayResults[i].day).add(settings.hours_close_teacher.value_int,'hours').isBefore()){
						dayResults[i]['canEdit'] = false;
								
					}else{
						dayResults[i]['canEdit'] = true;
						}
							
							dayResults[i].day = moment(dayResults[i].day).format('dddd[, ] MMMM Do');
						}
						res.render('offeringEdit.html', {
							isNew:true,
							data:{uid_offering: null, name: null, location: null, description: null, max_size: null, uid_teacher: null, recurring: null } ,
							offeringId: 0,
							dayData: dayResults
						});
					}
				});

		
	});




	app.post('/updateAttendance/:offering', middleware.isTeacher, function(req,res){
		var teacher_uid = req.user.local.uid_teacher;
		var students = req.body.students;
		var allStudents = req.body.allStudents; 
		if (allStudents == undefined){allStudents = []}

		for (var i = 0; i <allStudents.length;i++ ){
			con.query('update students set arrived = 0 where uid_student = ?',[allStudents[i]], function(err){
				if (err){
					console.log(err);
				}
			});
	
		}
		if (students == undefined){students = []}
			for (var i = 0; i <students.length;i++ ){
				con.query('update students set arrived = 1 where uid_student = ?',[students[i]], function(err){
					if (err){
						console.log(err);
					}
				});
	
			}
			res.redirect('back');
		

	});

	app.post('/addStudent/:offering/:day', middleware.isTeacher, function(req,res){
		var offering = req.params.offering;
		var day = req.params.day;
		var student = req.body.studentName;
		var students = [];
		var studentIDs = [];
		con.query('select uid_student, firstname, lastname from students', function(err, studentRes){
			if (!err && studentRes != undefined ){
				for (var s = 0; s <studentRes.length; s++){
					students.push(studentRes[s].firstname +" "+studentRes[s].lastname);
					studentIDs.push(studentRes[s].uid_student);
				}
				var c = getClosest.custom(student,students, function (compareTo, baseItem) {
  					return new Levenshtein(compareTo, baseItem).distance;
				});

				con.query('insert into choices (uid_day, uid_offering, uid_student) values (?,?,?);', [day, offering,studentIDs[c]], function(err){
					if (!err){
						res.redirect('back');
					} else {
						console.log(err);
					}
				});
				
			}
		});
	});

	app.get('/removeStudent/:day/:offering/:student', middleware.isTeacher, function(req,res){
		var day = req.params.day;
		var offering = req.params.offering;
		var student = req.params.student;

		con.query('delete from choices where uid_day = ? and uid_offering = ? and uid_student = ?', [day, offering, student], function(err) {
			if (err){
				console.log(err);
			} else {
				res.redirect('back');
			}
		});
	});
	//CSV Post
	app.post('/studentcsvinput', middleware.isAdmin, function(req,res) {
		if (res != undefined){
			admin.createStudentCSV(req.body.Rad);
			res.redirect('/admin');
		}
	});

	app.post('/teachercsvinput', middleware.isAdmin, function(req, res) {
		if (res != undefined){
			admin.createTeacherCSV(req.body.Radical);
			res.redirect('/admin');
		}
	});

	app.get('/csvinput', middleware.isAdmin, function(req,res) {
		res.render('clientcsv.html', {
		});
	});


	app.get('/Day/:id', function(req, res) {
		var day_uid = req.params.id;
			con.query('SELECT offerings.uid_offering, advisor, grade, CONCAT(teachers.teacher_firstname, \' \', teachers.teacher_lastname) AS teacher, offerings.name, offerings.location, offerings.description, offerings.max_size FROM calendar JOIN offerings on calendar.uid_offering = offerings.uid_offering JOIN teachers on teachers.uid_teacher = offerings.uid_teacher WHERE calendar.uid_day = ?;',[day_uid], function(err, resultsDay) {					
			res.render('Day.html', { 
				data:resultsDay,
			});
		});
	});
	
	app.get('/Offeringstudents/:id', middleware.isAdmin, function(req, res){
		var teacher_uid = req.params.id;
		//console.log(teacher_uid);
		con.query('select uid_offering from offerings where uid_teacher=?;',[teacher_uid], function(err, resultsO){
			var off=resultsO[0].uid_offering;
			//console.log(off);
			con.query('select uid_student from choices where uid_offering=?;', [off], function(err, resultsS){
				
				var stud=resultsS[0].uid_student;
				
				con.query('select lastname from students where uid_student=?;',[stud], function(err, resultsZ){
				con.query('select name from teachers where uid_teacher=?;', [teacher_uid], function(err, resultsN){
				console.log(resultsN.name);
				res.render('Offeringstudents.html',{
				name:resultsN.name,
				data:resultsZ
				});
			});
			});
		});
	});
	});



	app.get('/Admin', middleware.isAdmin, function(req, res){
		con.query('select * from opp_block_day;', function(err, resultsAdmin){
				//console.log(resultsAdmin);
				res.render('Admin.html',{
				
				data:resultsAdmin
				});
			
		});
	});
	

	//need to join those uid students with student names
	app.get('/Mopblock', middleware.isAdmin, function(req, res){
		con.query('SELECT students.uid_student, advisor, grade, CONCAT(firstname, \' \',lastname) AS studentname FROM choices JOIN students ON choices.uid_student = students.uid_student WHERE uid_offering is not NULL;', function(err, resultsMopblock){
				console.log(resultsMopblock);
				res.render('Mopblock.html',{
				data:resultsMopblock
			});
			
		});
	});
	//need to access stuff from choices table idk how
}
