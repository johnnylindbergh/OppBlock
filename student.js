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
        if(numStud >= max_size) {
          callback("disabled");
        } else {
          callback("able");
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
		      //	Uses isOfferingFull for every one, which will return either 'disabled' or 'able'
		      module.exports.isOfferingFull(uid_day, result[i].uid_offering, result[i].max_size, function(truth) {
				  //	Adds the availability of the offering as a property
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

// Takes in nothing
// Returns two values:
// A uid_day of the coming oppblock (null if the students can't yet choose) AND
// A boolean cutOff, signifying whether the user is now past the cutoff time for students' choices
 getSoonestOppblockDay: function(callback) {
	// Gets all Oppblock days
	con.query('SELECT * FROM opp_block_day', function(err, results){	
		if(!err){
			var uid_day = null;
			var closest = moment().add(1, 'y');
			for (var i=0; i<results.length; i++) {
				//	Loops to find soonest Oppblock
				var curr = moment(results[i].day, 'YYYY-MM-DD');
				// 	Specficies the oppblock to the end of oppblock on that date
				//	TO DO: SIMPLY THIS CODE
				curr.add({hours:settings["hours_close_oppblock"].value_int, minutes:settings["minutes_close_oppblock"].value_int}); 
				curr.add({minutes:settings["minutes_length_oppblock"].value_int}); 
				//	Checks if the current oppBlock day is in the future and before the closest
				//	If so, replaces closest with the current
				if (curr.isBefore(closest) && curr.isSameOrAfter(moment())) {
					closest = moment(curr.format('YYYY-MM-DD'));	
					uid_day = results[i].uid_day;				
				}
			} 
			// 	Creates Cutoff time variables relative to closest oppblock, based on admin settings
			var studentCutoff = moment(closest.add({hours:settings["hours_close_student"].value_int}));
			var teacherCutoff = moment(closest.add({hours:settings["hours_close_teacher"].value_int}));
			
			//	Checks to see whether the date is before or after the student and teacher cutoff times
			if (moment().isSameOrAfter(teacherCutoff)) {
				if (moment().isSameOrAfter(studentCutoff)) {
					callback(uid_day, true);
				} else {
					callback(uid_day, false);
				}
			} else {
				callback(null, null);
			}
		} else {
			console.log("Error in finding the upcoming oppblock");
		}
	});
 },

 //	A middleware to determine whether an offering is full or not
 //	Used in the post request to make sure students don't sign up for closed offerings
 isOpenOffering:function(req,res,next){
 	con.query('SELECT max_size FROM offerings WHERE uid_offering = ?', [req.body.choice], function(err, result) {
 		if(!err && result != undefined && result.length != 0) {
 			//	Checks if the offering is full
		 	module.exports.isOfferingFull(req.body.uid_day, req.body.choice, result[0].max_size, function(truth) {
		 		if(truth == "able") {
		 			//	Keeps going if the offering is open
			 		return next();
			    } else {
			    	//	Redirects to student if the offering is full, thereby cancelling the student's form submission
			    	res.redirect('/student');
			 	}
		 	});
 		} else {
 			//	Renders an error page if one occured
			res.render('error.html', {err:err});
 		}
 	});
 },

 init: function(app) {
	app.get('/student', middleware.isStudent, function(req, res){
		// Gets Student's id from middleware
		var student = req.user.local[0];
		var uid_student = student.uid_student; 

		// This query gets the student's first name for the display page, thereby checking whether the url contained a valid uid
		// This function finds the upcoming oppblock, whether it is time for students to choose, and whether it is past the cutoff time
		module.exports.getSoonestOppblockDay(function(uid_day, cutOff) {
		// Checks whether it is time for students to choose yet
			if (uid_day == null) { 
				res.render('student.html', {Student:student.firstname, Choice:"No Choice Selected", Description:"We're sorry, but the next OppBlock choices aren't ready yet. Check back soon!", oppTime:true, notExcluded:true});
			} else {
				// Knowing there is an upcoming oppblock day with choices, the system queries to find the student's current choice 
				con.query('SELECT uid_offering FROM choices WHERE uid_student = ? AND uid_day = ?', [uid_student, uid_day], function(err, currentChoice) { // only gets the uid not the name
					if(!err) {
						// Checks if the student is in the choice table at all, thereby seeing if he/she is excluded from the oppblock day
						if(currentChoice.length != 0) {
							//	Checks to see if the student hasn't chosen yet
							if (currentChoice[0].uid_offering == null) {
								// Checks to see if it is past the cutoff time for the students to choose
								if (cutOff) {
									// Renders the page with an admin's message for the student, as they have neglected to sign up.
									res.render('student.html', {Student:student.firstname, Choice:"None (You Forgot to Sign Up!)", Description:message_students_notsignedup, oppTime:true, notExcluded:true});
								} else {
									// Gets all offerings for the user to choose from
									module.exports.getOfferings(uid_day, function(offerings) {
										// At last, renders the page with the lack of choice, and the choices table
										res.render('student.html', {Student:student.firstname, Choice:"None", Description:"Choose an offering from the table below!", uid_day:uid_day, data:offerings, cutOffStudent:settings["hours_close_student"].value_int, notExcluded:true});
									});
								}
							} else {
								//	Knowing the student has chosen, it gets the name of their choice
								con.query('SELECT * FROM offerings WHERE uid_offering = ?', [currentChoice[0].uid_offering], function(err, choice) {
									if(!err) {
										// Checks to see if it is past the cutoff time for the students to choose
										if (cutOff) {
											// Renders the page only with the user's current choice
											res.render('student.html', {Student:student.firstname, Choice:choice[0].name, Description:"The time for choosing has passed. At 2:45, head to " + choice[0].location + "!", oppTime:true, notExcluded:true}); //Change Constant Time
										} else {
											// Gets all offerings for the user to choose from
											module.exports.getOfferings(uid_day, function(offerings) {
												// At last, renders the page with the current choice, and the choices table
												res.render('student.html', {Student:student.firstname, Choice:choice[0].name, Description:"You've already chosen, but if you'd like to change your choice, choose a different offering!", uid_day:uid_day, data:offerings, cutOffStudent:settings["hours_close_student"].value_int, notExcluded:true});
											});
										}
									} else {
										res.render('error.html', {err:err});
									}
								});
							}
						} else {
							// Renders the page without any choices, since the student is excluded
							res.render('student.html', {Student:student.firstname, Choice:"No Choice Required", Description:"Due to a sport or perhaps some other commitment, you will not participate in Oppblock today. Press Override if this doesn't apply to you.", uid_day:uid_day, oppTime:true});
						}
					} else {
						console.log("An error done occured.");
						res.render('error.html', {err:err});
					}
				});	
			}
		});	
	});
	
	//	The student post request serves to insert/update a student's choice in the database
	app.post('/student', middleware.isStudent, module.exports.isOpenOffering, function(req, res) {
		// Gets the student's uid, the uid of their offering of choice, and the current day uid
		var uid_student = req.user.local[0].uid_student; 
		var uid_offering = req.body.choice;
		var uid_day = req.body.uid_day;

		// Makes sure the student has chosen something
		if(uid_offering != undefined) {
			// Updates their choice in the database
			con.query('UPDATE choices SET uid_offering = ? WHERE uid_student = ? AND uid_day = ?', [uid_offering, uid_student, uid_day], function(err, results) {
				if(!err) {
					//	Redirects back once the update has been carried out
					res.redirect('/student');
				} else {
					//	Renders an error page if one occured
					res.render('error.html', {err:err});
				}
			});
		} else {
			//	Redirects back if the student hasn't chosen anything
			res.redirect('/student');
		}

	});

	//	This post request is for when students are excluded wrongfully from an OppBlock Day
	app.post('/studentOverride', middleware.isStudent, function(req, res) {
		// Gets the student's uid and the current day uid
		var uid_student = req.user.local[0].uid_student;
		var uid_day = req.body.uid_day;

		// Overrides an excluded group by adding the student into the choice table
		con.query('INSERT INTO choices (uid_student, uid_day) values (?, ?)', [uid_student, uid_day], function(err) {
			if(!err) {
				//	Redirects back since the request has been carried out
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
