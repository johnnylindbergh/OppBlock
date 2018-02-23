var con = require('./database.js').connection;
var settings = require('./settings.js');
var moment = require('moment');
var middleware = require('./roles.js');
module.exports =  {

	// initialize routes for admin backend
	// TODO: (P1) restrict access to these routes to authenticated admins only using middleware (tbd)
	init: function(app) {
		app.get("/settings", middleware.isAdmin, function(req, res) {
			var data = [];
			var keys = Object.keys(settings.system_settings);
			for (var i = 0; i < keys.length; i++) {	// loop through all settings
				data.push(settings.system_settings[keys[i]]);
			}
			res.render("adminsettings.html", {settings: data});
		});
		app.post("/settings", middleware.isAdmin, function(req, res) {
			var keys = Object.keys(req.body);
			var key_count = keys.length;	// counts the number of remaining keys to update in DB
			for(var i = 0; i < keys.length; i++) {
				settings.update(keys[i], req.body[keys[i]], function(err) {
					if (!err) {
						key_count--;
						if (key_count == 0)
							res.redirect("/settings");
					} else {
						res.end("Could not update settings -- reboot server.");
					}
				});
			}
		});
		//	Opp Block Creation Calendar Endpoints
		app.get('/calendar', middleware.isAdmin, function(req, res) { 
			//	Gets all currently saved OppBlock days
			con.query('SELECT * FROM opp_block_day', function(err, oppDays) {
				if (!err) {
					if (oppDays.length != 0) {
						var days = [];
						//	Pushes the date objects into an array in a readable format for mustache THEN
						//	Runs addStudentsToChoiceTable() on each day, putting students into the choice table if necessary
						for(var i = 0; i<oppDays.length; i++) {
							days.push({day: moment(oppDays[i].day).format('YYYY-MM-DD')});
							module.exports.addStudentsToChoiceTable(oppDays[i].uid_day);
						}
						//	Renders the page with the array of days and a setting which determines the days of the week OppBlock most likely happens on
						res.render('admincalendar.html', {batchSelect: settings.opp_days, days: days});
					} else {
						res.render('admincalendar.html', {batchSelect: settings.opp_days, days: null});
					}
				} else {
					res.render('error.html', {err:err});
				}
			});
		});
		app.post('/calendar', middleware.isAdmin, function(req, res) {
			//	This post request inserts an admin's desired Oppblock days into the database
			//	
			//	First checks if there is only one day input, which would be treated as a string
			if (typeof(req.body.newDays) == "string") {
				con.query('INSERT INTO opp_block_day (day) VALUES (?)', [req.body.newDays], function(err, result) { 
					if(!err) {
						res.redirect('/calendar');
						res.end();
					} else {
						res.render('error.html', {err:err});
					}
				});
			} else { //	Otherwise loops through the inputs to insert them into the database
				var callback = 0;
				for (var i=0; i<req.body.newDays.length; i++) {
					con.query('INSERT INTO opp_block_day (day) VALUES (?)', [req.body.newDays[i]], function(err, result) { 
						if(!err) {
							callback += 1;
							if (callback == req.body.newDays.length) {
								res.redirect('/calendar');
								res.end();
							}
						} else {
							res.render('error.html', {err:err});
						}
					});
				}
			}
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
			res.render('clientcsv.html');
		});

		//	This is the main admin page, with links to the MopBlock and offering pages for each day
		app.get('/Admin', middleware.isAdmin, function(req, res){
			//	Gets all the oppblock days
			con.query('select * from opp_block_day ORDER BY day ASC', function(err, resultsAdmin){
				if(!err) {
					//	Loops through all the days and formats them nicely
					for (var i=0; i<resultsAdmin.length; i++) {
						var day = moment(resultsAdmin[i].day).format('YYYY-MM-DD');
						resultsAdmin[i].day = day;
					}
					//	Renders the page
					res.render('Admin.html', {data:resultsAdmin});
				} else {
					//	Renders the error page if an error occured
					res.render('error.html', {err: err});
				}
			});
		});

		//	This page lets admins check all the offerings on a certain day and gives links to each '/offeringstudents' page for those offerings
		app.get('/day/:day/:date', middleware.isAdmin, function(req, res) {
			//	The uid and the date of the day are taken from the url and made into variables for easy use
			var uid_day = req.params.day;
			var date = req.params.date;
			//	This massive query gets all the offerings (with all their data) for a certain day
			con.query('SELECT offerings.uid_offering, CONCAT(teachers.teacher_firstname, \' \', teachers.teacher_lastname) AS teacher, offerings.name, offerings.location, offerings.description, offerings.max_size FROM calendar JOIN offerings on calendar.uid_offering = offerings.uid_offering JOIN teachers on teachers.uid_teacher = offerings.uid_teacher WHERE calendar.uid_day = ?;', [uid_day], function(err, resultsDay) {
				if(!err) {
					//	Renders the page
					res.render('Day.html', {date:date, uid_day:uid_day, data:resultsDay});
				} else {
					//	Renders the error page if an error occured
					res.render('error.html', {err: err});
				}
			});
		});
		
		//	This page lets admins see all the students signed up for a certain offering on a certain day
		app.get('/offeringstudents/:offering/:day', middleware.isAdmin, function(req, res){
			//	The uid of the day and offering are taken from the url and made into variables for easy use
			var uid_offering = req.params.offering;
			var uid_day = req.params.day;
			//	Gets all the students currently signed up for this offering on this day from the db
			con.query('SELECT CONCAT(students.lastname, \', \',students.firstname) AS studentname  FROM choices JOIN students ON choices.uid_student = students.uid_student WHERE uid_offering = ? AND uid_day = ? ORDER BY students.lastname, students.firstname DESC;', [uid_offering, uid_day], function(err, results){
				if(!err) {
					//	Gets the name of the offering, so that the user doesn't have to remember which one they clicked
					con.query('SELECT name FROM offerings WHERE uid_offering = ?', [uid_offering], function(err, resultsName) {
						if(!err) {
							//	Renders the page
							res.render('Offeringstudents.html', {name:resultsName[0].name, data:results});
						} else {
							//	Renders the error page if an error occured
							res.render('error.html', {err: err});
						}
					})
				} else {
					//	Renders the error page if an error occured
					res.render('error.html', {err: err});
				}
			});
		});
		
		//	This page lets admins see all the students who have failed to sign up on a day
		app.get('/mopblock/:day/:date', middleware.isAdmin, function(req, res){
			//	The uid and the date of the day are taken from the url and made into variables for easy use
			var uid_day = req.params.day;
			var date = req.params.date;
			//	Gets all the students who haven't signed up and their names
			con.query('SELECT students.uid_student, COUNT(students.uid_student) AS count, students.advisor, students.grade, CONCAT(students.lastname, \', \',students.firstname) AS studentname FROM choices JOIN students ON choices.uid_student = students.uid_student WHERE uid_offering IS NULL AND uid_day = ? ORDER BY students.grade, students.lastname, students.firstname DESC;', [uid_day], function(err, resultsMopblock){
				if(!err) {
					//	Renders the page
					res.render('Mopblock.html', {date:date, data:resultsMopblock});
				} else {
					//	Renders the error page if an error occured
					res.render('error.html', {err: err});
				}
			});
		});
		
		//	This page lets admins see all the students who haven't showed up for their offering on a certain day
		app.get('/notarrived/:day/:date', middleware.isAdmin, function(req, res) {
			//	The uid and the date of the day are taken from the url and made into variables for easy use
			var uid_day = req.params.day;
			var date = req.params.date;
			// Gets all the students on that day who have signed up, but not yet arrived at their offering
			con.query('SELECT offerings.name, offerings.uid_offering, students.uid_student, students.advisor, students.grade, CONCAT(students.lastname, \', \',students.firstname) AS studentname FROM choices JOIN students ON choices.uid_student = students.uid_student JOIN offerings ON choices.uid_offering = offerings.uid_offering WHERE choices.uid_offering IS NOT NULL AND arrived = 0 AND uid_day = ? ORDER BY students.grade, students.lastname, students.firstname DESC;', [uid_day], function(err, resultsNotarrived){
				if(!err) {
					//	Renders the page
					res.render('notarrived.html', {date:date, data:resultsNotarrived});
				} else {
					//	Renders the error page if an error occured
					res.render('error.html', {err: err});
				}
			});
		});

		app.get('/stats', middleware.isAdmin, function(req, res) {
			res.send("This page is under construction. Check back soon!");
		});

		//	A page letting admins create/manage excluded groups
		app.get('/groups', middleware.isAdmin, function(req, res) {
			res.send("This page is under construction. Check back soon!");
		});

		//	TO DO: 
		//		Implement the '/notarrived' page that shows all those who haven't arrived at their offering (which dynamically updates?)
		//		Implement the '/stats' page that gives long term data for offerings, teachers, and students (1984???)
		//
		//		Replace some of the get requests with post requests because a lot of links have the disgusting '/:day/:date'??? But then harder to refresh???
		return this;
		// Note: return this returns this module so we can do this elsewhere:
		// var admin = require('./admin.js').init(app);
		// ...which keeps things very clean
	},
	
	//add CSV file of students to database
	createStudentCSV: function(studentdata) {
		//convert giant string into array
		var a = studentdata.split("\n");	// this is an array of every line
		for (var i = 0; i < a.length; i++) {
			var line = a[i].trim();
			var b = line.split(",");
			for (var j = 0; j < b.length; j++)
				b[j] = b[j].trim();
	  		//add values in array to database
  			//console.log(studentdata);
  			con.query('INSERT INTO students(lastname, firstname, grade, gender, email) VALUES (?, ?, ?, ?, ?);', [b[0], b[1], b[2], b[3], b[4]], function(err, result) {
  				if (err) throw err;
  			});
		}	

  	},

  	createTeacherCSV: function(teacherdata) {
  		//var a is giant string input
  		var a = teacherdata.split("\n");
  		for (var i = 0; i < a.length; i++) {
  			var line = a[i].trim();
  			//var b is array of strings
  			var b = line.split(",");

			for (var j = 0; j < b.length; j++)
				b[j] = b[j].trim();

  			//query
  			con.query('INSERT INTO teachers(teacher_lastname, teacher_firstname, teacher_email) VALUES (?, ?, ?);', [b[0], b[1], b[2]], function(err, result) {
  				if (err) throw err;
  			});
  		}
  	},

	//create student if nothing exists in database, update student_info if something does
	createStudent: function(studentlastName, studentFirstName, studentGrade, studentSport, studentAdvisor, studentGender, studentEmail, callback) {
		con.query('SELECT uid_student FROM students WHERE student_email = ?;', [student_email], function(err, results) {
			if(results[0] == undefined) {
				//if nothing is found in database, create new student
				con.query('INSERT INTO students(student_lastname, student_firstname, student_grade, student_sport, student_advisor, student_gender, student_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [studentLastName, studentFirstName, studentGrade, studentSport, studentAdvisor, studentGender, studentEmail], function(result) {
					callback(result);
				});
			}
			else {
				//if something is found, update student info
				con.query('UPDATE students SET student_lastname = ? , student_firstname, student_grade, student_sport, student_advisor, student_gender, student_email) WHERE student (uid_student = ?);', [studentLastName, studentFirstName, studentGrade, studentSport, studentAdvisor, studentGender, studentEmail, results[0].uid_student], function(result) {
					callback(result);
				});
			}
		});
	},

	getUidFromValue: function (tableType, value, callback) {
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
			con.query('SELECT uid_student FROM students WHERE firstname = ?', [value], function(err, results) {
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
				if (results != undefined){
					callback(results[0].uid_offering);  
				}else{
					callback(null); 
				}     
			});
		}

	},

	getExcludedStudentsOnDay: function (uid_day,callback){
		var excludedStudentUidArray = [];
		module.exports.getExcludedGroupsOnDay(uid_day, function(groups){
			con.query('SELECT uid_student FROM student_groups WHERE uid_group in (?)', [groups], function(err, results) {
				if (results != undefined){
					for (var i = 0; i < results.length; i++) {
						excludedStudentUidArray.push(results[i].uid_student);
					}
				} 
				callback(excludedStudentUidArray);
			});
		});
	},

	getExcludedGroupsOnDay: function (uid_day,callback){
		var excludedGroupsArray = [];
		con.query('SELECT uid_group FROM excluded_groups WHERE uid_day = ?', [uid_day], function(err, results) {
			for (var i = 0; i < results.length; i++) {
				excludedGroupsArray.push(results[i].uid_group);
			}
			callback(excludedGroupsArray); 
		});
	},
	//	Excludes all excluded students from the choices table for a given OppBlock Day
	excludeStudentsOnDay(uid_day) {
		module.exports.getExcludedStudentsOnDay(uid_day, function(students) {
			for(var i=0; i<students.length; i++) {
				con.query('DELETE FROM choices WHERE uid_student = ?', [students[i]]);
			}
		});
	},
	//	TO DO:
	//		Take out the initial check once this has been run on the real server
	//	---
	//	A function to add students to the choices table for a new oppblock day
	addStudentsToChoiceTable: function (uid_day) {
		con.query('SELECT * FROM choices WHERE uid_day = ?', [uid_day], function(err, choices) {
			if(!err) {
				//	***Change Possibly if Excluded Groups Featured Implemented***
				//	Makes sure the students haven't already been added to the choice table for this day
				if(choices.length == 0) {
					con.query('SELECT uid_student FROM students', function(err, students) {
						if(!err) {
							for (var i = 0; i < students.length; i++) {
								con.query('INSERT into choices (uid_day, uid_student) values (?,?);', [uid_day, students[i].uid_student]);
							} 
						} else {
							console.log("Add Students to Choice Table Errored with message: ");
							console.log(err);
						}
					});
				} 
			} else {
				console.log("Add Students to Choice Table Errored with message: ");
				console.log(err);
			} 
		});
	},








	getStudentThatNeedToChooseOffering:function (uidDay, callback){
		con.query('SELECT uid_student FROM choices WHERE uid_day = ? AND uid_offering is NULL;',[uidDay], function(err, res) { 
			callback(res);
		});
	},

	getChoice:function (uidDay, uidStudent, callback){
		con.query('SELECT uid_offering FROM choices WHERE uid_day = ? AND uid_student = ?;',[uidDay, uidStudent], function(err, res) { 
			callback(res);
		});
	}
	
	
}

