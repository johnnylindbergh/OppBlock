var con = require('./database.js').connection;
var moment = require('moment');
var settings = require('./settings').system_settings;
var middleware = require('./roles.js');

// A message to students who haven't signed up after the student cutoff time has passed
// Can't be a system setting because it is text
// Will reflect an administrator decision
var message_students_notsignedup = "Meet Mr. Ware in the dining hall!";

module.exports = {
 // Gets the number of students in an offering on a day
 numStudents: function (uid_day, uid_offering, callback) {
 	var numStud = 0;
 	con.query('SELECT COUNT(*) AS count FROM choices WHERE uid_offering = ? AND uid_day = ?', [uid_offering, uid_day], function(err, students) {
 		if(!err) {
	 		callback(students[0].count);
 		} else {
 			console.error("Cannot count students in offering.");
 		}
 	});
 },

 //	Pretty Self Explanatory
 isOfferingFull: function (uid_day, uid_offering, max_size, callback) {
    //	Gets the number of students in an offering 
    module.exports.numStudents(uid_day, uid_offering, function(numStud) {
        //	Compares that number to the offering's maximum size
        //	CHANGE
        console.log((numStud >= max_size));
        if(numStud >= max_size) {
          callback(true);
        } else {
          callback(false);
        }    
    });
 },

 // Function gets all offerings on a certain day (uid_day)
 // Returns a list of Offering objects including a property for avalialability ('.disbaled')
 getOfferings: function (uid_day, callback) {
 	//	Join query to find a list of offerings on a certain day with the name of their teacher
 	con.query('SELECT * from offerings JOIN calendar on offerings.uid_offering = calendar.uid_offering JOIN teachers on teachers.uid_teacher = offerings.uid_teacher WHERE calendar.uid_day = ?', [uid_day], function(err, result) {
		//	Makes sure the join query didn't error or produce an empty set
		if (!err && result != undefined) {
			
			//	Loops through every offering to find whether or not it is full
			var j = 0;
		    for(var i = 0; i < result.length; i++) {
		      //	Checks if every offering is full or not
		      module.exports.isOfferingFull(uid_day, result[i].uid_offering, result[i].max_size, function(truth) {
				  //	Adds the availability of the offering as a property
				  if(truth) {
				  	truth = "disabled";
				  } else {
				  	truth = "able";
				  }
				  result[j].disabled = truth;
				  j+=1;
				  
				  //	Calls back the list once all the queries have run
				  if (j==result.length) {
					callback(result);
				  }
		      });
		    }
		} else {
			console.log("We're sorry. A join query produced an error and or an empty set.");
		}
	});
 },

 //	A middleware to get the uid and date of the next OppBlock for future use
 nextOppblockDay: function(req, res, next) {
 	// Gets all Oppblock days
	con.query('SELECT * FROM opp_block_day ORDER BY day DESC', function(err, results){	
		if(!err){
			var closest;
			var uid_day;
			//	Loops to find soonest Oppblock
			for (var i=0; i<results.length; i++) {
				var curr = moment(results[i].day, 'YYYY-MM-DD');
				// 	Specficies the oppblock to the end of oppblock on that date
				curr.add({hours:settings["hours_close_oppblock"].value_int, minutes:settings["minutes_close_oppblock"].value_int}); 
				curr.add({minutes:settings["minutes_length_oppblock"].value_int}); 
				//	Checks if the current oppBlock day is in the future and replaces it as the closest if so
				if (curr.isSameOrAfter(moment())) {
					closest = moment(curr.format('YYYY-MM-DD'));	
					uid_day = results[i].uid_day;
				}
			} 
			//	Leaves the uid_day and moment date object in req.student for use by future middlewares
			req.student.uid_day = uid_day;
			req.student.day = closest;
			
			return next();
		} else {
			//	Renders an error page if one occured
			res.render('error.html', {err:err});
		}
	});
 },

 //	A middleware checking if the student exists in the choices table; saves his/her choice for future use if so; otherwise renders the excluded student page
 isStudentExcluded: function(req, res, next) {
 	//	Gets student/day from req object
	var uid_student = req.user.local[0].uid_student;  
 	var uid_day = req.student.uid_day;
 	
 	con.query('SELECT uid_offering FROM choices WHERE uid_student = ? AND uid_day = ?', [uid_student, uid_day], function(err, choice) { // only gets the uid not the name
 		if(!err) {
 			if (choice.length != 0) {
 				//	Leaves the choice in req.student for use by future middlewares
 				req.student.choice = choice[0].uid_offering;

 				return next();
 			} else {
 				// Renders the page without any choices, since the student is excluded
				res.render('student.html', {Student:student.firstname, Choice:"No Choice Required", Description:"Due to a sport or perhaps some other commitment, you will not participate in Oppblock today. Press Override if this doesn't apply to you.", uid_day:uid_day, oppTime:true});
 			}
 		} else {
 			//	Renders an error page if one occured
			res.render('error.html', {err:err});
 		}
 	});
 },

 //	A middleware
 isStudentTime: function(req, res, next) {
 	// Gets Student's id from the req object
	var student = req.user.local[0];
	var uid_student = student.uid_student; 

 	//	Creates Cutoff time variables relative to closest oppblock, based on admin settings
	var oppBlockDay = req.student.day;
	var studentCutoff = moment(oppBlockDay.add({hours:settings["hours_close_student"].value_int}));
	var teacherCutoff = moment(oppBlockDay.add({hours:settings["hours_close_teacher"].value_int}));
	
	//	Checks if after the teacher cutoff
	if (moment().isSameOrAfter(teacherCutoff)) {
		//	Checks if after the student cutoff
		if (moment().isSameOrAfter(studentCutoff)) {
			//	Checks whether the student has chosen yet
			if (req.student.choice == null) {
				// Renders the page with an admin's message for the student, as they have neglected to sign up.
				res.render('student.html', {Student:student.firstname, Choice:"None (You Forgot to Sign Up!)", Description:message_students_notsignedup, oppTime:true, notExcluded:true});
			} else {
				// Renders the page only with the user's current choice
				res.render('student.html', {Student:student.firstname, Choice:choice[0].name, Description:"The time for choosing has passed. At 2:45, head to " + choice[0].location + "!", oppTime:true, notExcluded:true}); //Change Constant Time
			}
		} else {
			return next();
		}
	} else {
		//	Renders the page to show that the choices aren't ready yet, since the teachers haven't yet been cutoff
		res.render('student.html', {Student:student.firstname, Choice:"No Choice Selected", Description:"We're sorry, but the next OppBlock choices aren't ready yet. Check back soon!", oppTime:true, notExcluded:true});
	}
 },

 //	A middleware to determine whether a choice is valid (a real offering, existing on the current day, that's not yet full)
 isValidChoice: function(req, res, next) {
 	var uid_offering = req.body.choice;
	var uid_day = req.student.uid_day;

 	// Makes sure the student has actually made a choice
	if(uid_offering != undefined) {
		//	Join query checks if the offering has a valid uid and is offered on the current day
		con.query('SELECT offerings.name, offerings.max_size calendar.uid_offering FROM calendar JOIN offerings ON calendar.uid_offering = offerings.uid_offering WHERE calendar.uid_offering = ? AND calendar.uid_day = ?', [uid_offering, uid_day], function(err, resultsOffering) {
			if(!err && resultsOffering != undefined && resultsOffering.length != 0 && ) {
				//	Checks if the offering is full
				isOfferingFull(uid_day, uid_offering, resultsOffering[0].max_size, function(full) {
					if(!full) {
						return next();
					} else {
						res.render('error.html', {err:"You tried to sign up for a full offering! Go back."});
					}
				});
	 		} else {
	 			//	Renders an error page if one occured OR if the user sent a malformed post request
				res.render('error.html', {err:err});
	 		}
		});
	} else {
		res.redirect('/student');
	}
 	return next();
 },

 init: function(app) {
	app.get('/student', middleware.isStudent, module.exports.nextOppblockDay, module.exports.isStudentExcluded, module.exports.isStudentTime, function(req, res){
		// Gets Student's id from the req object
		var student = req.user.local[0];
		var uid_student = student.uid_student; 

		// Gets all offerings for the user 
		module.exports.getOfferings(uid_day, function(offerings) {
			//	Checks whether the student has chosen yet
			if (req.student.choice == null) {
				// At last, renders the page with the lack of choice, and the choices table
				res.render('student.html', {Student:student.firstname, Choice:"None", Description:"Choose an offering from the table below!", uid_day:uid_day, data:offerings, cutOffStudent:settings["hours_close_student"].value_int, notExcluded:true});
			} else {
				// At last, renders the page with the current choice, and the choices table
				res.render('student.html', {Student:student.firstname, Choice:choice[0].name, Description:"You've already chosen, but if you'd like to change your choice, choose a different offering!", uid_day:uid_day, data:offerings, cutOffStudent:settings["hours_close_student"].value_int, notExcluded:true});
			}
		});
	});
	
	//	The student post request serves to insert/update a student's choice in the database
	app.post('/student', middleware.isStudent, module.exports.nextOppblockDay, module.exports.isStudentExcluded, module.exports.isStudentTime, module.exports.isValidChoice, function(req, res) {
		// Gets the student's uid, the uid of their offering of choice, and the current day uid
		var uid_student = req.user.local[0].uid_student; 
		var uid_offering = req.body.choice;
		var uid_day = req.student.uid_day;

		// Updates the student's choice in the database
		con.query('UPDATE choices SET uid_offering = ? WHERE uid_student = ? AND uid_day = ?', [uid_offering, uid_student, uid_day], function(err, results) {
			if(!err) {
				//	Redirects back once the update has been carried out
				res.redirect('/student');
			} else {
				//	Renders an error page if one occured
				res.render('error.html', {err:err});
			}
		});
	});

	//	This post request is for when students are excluded wrongfully from an OppBlock Day
	app.post('/studentOverride', middleware.isStudent, module.exports.nextOppblockDay, function(req, res) {
		// Gets the student's uid and the current day uid
		var uid_student = req.user.local[0].uid_student;
		var uid_day = req.student.uid_day;

		// Overrides an excluded group by adding the student into the choice table
		con.query('INSERT INTO choices (uid_student, uid_day) values (?, ?)', [uid_student, uid_day], function(err) {
			if(!err) {
				res.redirect('/student');
			} else {
				//	Renders an error page if one occured
				res.render('error.html', {err:err});
			}
		});
	});
	return this;
 }
}
