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
 numStudents: function(uid_day, uid_offering, getStudentInfo, callback)	{
 	var numStud = 0;
 	var studList = [];
  //	TO DO:
  //	REPLACE THIS CALLBACK STRING WITH A JOIN QUERY
  //	EITHER USE GETSTUDENTINFO IN ANOTHER FILE OR CUT IT
  //
 	con.query('SELECT * FROM choices', function(err, row) {
    	if(!err) {
	    	for(var i=0; i<row.length; i++) {
	         	if(uid_offering == row[i].uid_offering && uid_day == row[i].uid_day) {
		           	numStud += 1;
		           	if(getStudentInfo) {
		             	studList.push(row[i].uid_student);
		           	}
	         	}  
	       	}
	       	if(getStudentInfo) {
	         	var infoList = [];    
	         	con.query('SELECT * FROM students', function(err, row) {
		           	if(!err) {
		            	for(var i=0; i<row.length; i++) {
		               		for(var j=0; j<studList.length; j++) {
			                 	if(row[i].uid_student == studList[j]) {
			                		infoList.push(row[i].firstname + " " + row[i].lastname);
			                 	}
		               		}
		            	} 
		            	callback(numStud, infoList);
		            } else {
		            	console.log("SELECT FROM STUDENTS DONE ERRD");
	             		console.log(err);
		            }
	         	});
	       	} else {
	         callback(numStud, null);
	     	}
       	} else {
       		console.log("SELECT FROM CHOICES DONE ERRD");
       		console.log(err);
 		}
 	});
 },

 //	Pretty Self Explanatory
 isOfferingFull: function (uid_day, uid_offering, callback) {
 	//	Gets the maximum size
   con.query('SELECT max_size FROM offerings WHERE uid_offering = ?', [uid_offering], function(err, data) {
    if(!err) {
      //	Gets the number of students in an offering 
      module.exports.numStudents(uid_day, uid_offering, false, function(num, infoList){
        //	Compares that number to the offering's maximum size
        if(num >= data[0].max_size) {
          callback("disabled");
        } else {
          callback("able");
        }    
      });
    } else {
      console.log("The function produced an error.");
    }
  });
 },

 // Function gets all offerings on a certain day (uid_day)
 // Returns a list ('offerList') of Offering objects, with all necessary properties (although the teacher will be a Name NOT a uid)
 getOfferings: function (uid_day, callback) {
   function Offering(uid, name, description, maxSize, recurring, teacher, location) {
    this.uid = uid;
    this.name = name;
    this.description = description;
    this.maxSize = maxSize;
    this.recur = recurring;
    this.teacher = teacher;
    this.location = location;
    this.disabled;
  }
  var offerList = [];
  var trueOffers = [];
  //	TO DO:
  //	REPLACE THIS CALLBACK STRING WITH A JOIN QUERY
  //
  //	Gets all offerings associated with that day
  con.query('SELECT * FROM calendar', function(err, dayList){
    for(var i=0; i<dayList.length; i++) {
      if(dayList[i].uid_day == uid_day) {
        trueOffers.push(dayList[i].uid_offering);
      }
    }
    //	TO DO:
    //	ORDER OFFERINGS FOR NICENESS
    //	Gets the info associated with those offerings
    con.query('SELECT * FROM offerings', function(err, rowList) {
      if(!err) {
        for(var i=0; i<rowList.length; i++) {
          for(var j=0; j<trueOffers.length; j++) {
            if(rowList[i].uid_offering == trueOffers[j]) {
              var offering = new Offering(rowList[i].uid_offering, rowList[i].name, rowList[i].description, rowList[i].max_size, rowList[i].recurring, rowList[i].uid_teacher, rowList[i].location);
              offerList.push(offering);
            }
          }
        }
        //	Gets the teacher's names rather than their uids
        con.query('SELECT * FROM teachers', function(err, row) {
          if(!err) {
            for(var j=0; j<row.length; j++) {
              for(var i=0; i<offerList.length; i++) {
                if(row[j].uid_teacher == offerList[i].teacher) {
                  offerList[i].teacher = row[j].teacher_lastname;
                };
              };
            };
            callback(offerList);
          } else {
            console.log("We're sorry. getOfferings() produced an error.");
          }
        });
      } else {
        console.log("We're sorry. getOfferings() produced an error.");
      } 
    }); 
  });
 },

// Function takes in an Oppblock day
// Returns a list of unfilled Offering Objects for that day
 getAvailableOfferings: function (uid_day, callback) {
  //	TO DO:
  //	REMOVE THIS FUNCTION AND PUT THE DISABLING LOOP IN GETOFFERINGS
  var availableList = []
  module.exports.getOfferings(uid_day, function(response) {
    var j = 0;
    for(var i = 0; i <response.length; i++) {
      module.exports.isOfferingFull(uid_day, response[i].uid, function(truth){
		  response[j].disabled = truth;
		  availableList.push(response[j]);
		  j+=1;
		  if(j==response.length) {
			callback(availableList);
		  }
      });
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
				console.log(curr);
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
 	//	Checks if the offering is full
 	module.exports.isOfferingFull(req.body.uid_day, req.body.choice, function(truth) {
 		if(truth == "able") {
 			//	Keeps going if the offering is open
	 		return next();
	    } else {
	    	//	Redirects to student if the offering is full, thereby cancelling the student's form submission
	    	res.redirect('/student');
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
									module.exports.getAvailableOfferings(uid_day, function(offerings) {
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
											module.exports.getAvailableOfferings(uid_day, function(offerings) {
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
	
	//	The student post request serves two functions: to insert a student's choice into the database and to override an exclusion from the OppBlock Day
	app.post('/student', middleware.isStudent, module.exports.isOpenOffering, function(req, res) {
		// Gets the student's uid, the uid of their offering of choice, and the current day uid
		var uid_student = req.user.local[0].uid_student; 
		var uid_offering = req.body.choice;
		var uid_day = req.body.uid_day;
		
		// checks if post request comes from an override or a choice
		if(uid_offering != undefined) {
			// Updates Choice
			con.query('UPDATE choices SET uid_offering = ? WHERE uid_student = ? AND uid_day = ?', [uid_offering, uid_student, uid_day], function(err, results) {
				if(!err) {
					//	Redirects back since the request has been carried out
					res.redirect('/student');
				} else {
					res.render('error.html', {err:err});
				}
			});
		} else {
			// Overrides an excluded group by adding the student into the choice table
			con.query('INSERT INTO choices (uid_offering, uid_student, uid_day) values (?, ?, ?)', [null, uid_student, uid_day], function(err) {
				if(!err) {
					//	Redirects back since the request has been carried out
					res.redirect('/student');
				} else {
					res.render('error.html', {err:err});
				}
			});
		}
	});
	return this;
 }
}
