var con = require('./database.js').connection;
var moment = require('moment');
var settings = require('./settings').system_settings;
module.exports = {

 // Gets the number of students in an offering on a day
 numStudents: function(uid_day, uid_offering, getStudentInfo, callback)	{
 	var numStud = 0;
 	var studList = [];
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

 isOfferingFull: function (uid_day, uid_offering, callback) {
   con.query('SELECT max_size FROM offerings WHERE uid_offering = ?', [uid_offering], function(err, data) {
    if(!err) {
      module.exports.numStudents(uid_day, uid_offering, false, function(num, infoList){
        if(num <= data[0].max_size) {
          callback(true);
        } else {
          callback(false);
        }    
      });
    } else {
      console.log("The function produced an error.");
    }
  });
 },

 // Function gets Offerings and their teachers on a certain day from database;
 // Returns list ('offerList') of Offering objects, with all necessary properties (although the teacher will be a Name NOT a uid)
 getOfferings: function (uid_day, callback) {
   function Offering(uid, name, description, maxSize, recurring, teacher) {
    this.uid = uid;
    this.name = name;
    this.description = description;
    this.maxSize = maxSize;
    this.recur = recurring;
    this.teacher = teacher;
  }
  var offerList = [];
  var trueOffers = [];
  // Gets all offerings associated with that day
  con.query('SELECT * FROM calendar', function(err, dayList){
    for(var i=0; i<dayList.length; i++) {
      if(dayList[i].uid_day == uid_day) {
        trueOffers.push(dayList[i].uid_offering);
      }
    }
    // Gets the info associated with those offerings
    con.query('SELECT * FROM offerings', function(err, rowList) {
      if(!err) {
        for(var i=0; i<rowList.length; i++) {
          for(var j=0; j<trueOffers.length; j++) {
            if(rowList[i].uid_offering == trueOffers[j]) {
              var offering = new Offering(rowList[i].uid_offering, rowList[i].name, rowList[i].description, rowList[i].max_size, rowList[i].recurring, rowList[i].uid_teacher);
              offerList.push(offering);
            }
          }
        }
        // Gets the teacher's names rather than their uids
        con.query('SELECT * FROM teachers', function(err, row) {
          if(!err) {
            for(var j=0; j<row.length; j++) {
              for(var i=0; i<offerList.length; i++) {
                if(row[j].uid_teacher == offerList[i].teacher) {
                  offerList[i].teacher = row[j].teacher_info;
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
  var availableList = []
  module.exports.getOfferings(uid_day, function(response) {
    var j = 0;
    for(var i = 0; i <response.length; i++) {
      module.exports.isOfferingFull(uid_day, response[i].uid, function(truth){
        if(truth) {
          availableList.push(response[j]);
        }
        j+=1;
        if(j==response.length) {
      		callback(availableList);
      	}
      });
    }
  });
 },

// Takes in nothing, since moment.js can give the current time and date always
// Returns two values:
// A uid_day of the coming oppblock (null if the students can't yet choose) AND
// A boolean cutOff, signifying whether the user is now past the cutoff time for students' choices
 getSoonestOppblockDay: function(callback) {
	con.query('SELECT * FROM opp_block_day', function(err, results){
		// Gets all Oppblock days
		if(!err){
			var uid_day = null;
			var closest = moment().add(1, 'y');
			for (var i=0; i<results.length; i++) {
				// Loops to find soonest Oppblock
				var curr = moment(results[i].day, 'YYYY-MM-DD');
				if(curr.isBefore(closest) && curr.isSameOrAfter(moment())) {
					closest = curr;	
					uid_day = results[i].uid_day;				
				}
			} 
			// 	Creates Cutoff time variables relative to closest oppblock, based on admin settings
			var studentCutoff = moment(closest.add({hours:settings["hours_close_student"].value_int}));
			var teacherCutoff = moment(closest.add({hours:settings["hours_close_teacher"].value_int}));
			// 	Specficies the oppblock to a specific time on that specific date
			closest = closest.add({hours:settings["hours_close_oppblock"].value_int, minutes:settings["minutes_close_oppblock"].value_int}); 
			
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
 init: function(app) {
	app.get('/student/:id', function(req, res){
		// Gets Student's id from url
		var uid_student = req.params.id; 
		// This query gets the student's first name for the display page, thereby checking whether the url contained a valid uid
		con.query('SELECT firstname FROM students WHERE uid_student = ?', [uid_student], function(err, student) {
			if(!err) {
				if(student.length != 0) {
					// This function finds the upcoming oppblock, whether it is time for students to choose, and whether it is past the cutoff time
					module.exports.getSoonestOppblockDay(function(uid_day, cutOff) {
						// Checks whether it is time for students to choose yet
						if (uid_day == null) { 
							res.render('student.html', {Student:student[0].firstname, Choice:"No Choice Selected", Description:"We're sorry, but the next Oppblock choices aren't ready yet. Check back soon!", oppTime:true, notExcluded:true});
						} else {
							// Knowing there is an upcoming oppblock day with choices, the system queries to find the student's current choice 
							con.query('SELECT uid_offering FROM choices WHERE uid_student = ? AND uid_day = ?', [uid_student, uid_day], function(err, currentChoice) {// only gets the uid not the name
								if(!err) {
									// Checks if the student is in the choice table at all, thereby seeing if he/she is excluded from the oppblock day
									if(currentChoice.length != 0) {
										con.query('SELECT name FROM offerings WHERE uid_offering = ?', [currentChoice[0].uid_offering], function(err, choice) {
											if(!err) {
												// Checks to see if it is past the cutoff time for the students to choose
												if (cutOff) {
													// Renders the page only with the user's current choice
													res.render('student.html', {Student:student[0].firstname, Choice:choice[0].name, Description:"The time for changing choices has passed. At 2:45, head to your current choice! Contact an Administrator immediately if you forgot to choose.", oppTime:true, notExcluded:true});
												} else {
													// Gets all offerings for the user, while checking whether they are excluded from that oppblock day
													module.exports.getAvailableOfferings(uid_day, function(offerings) {
														// At last, renders the page with the current choice, and the choices table
														res.render('student.html', {Student:student[0].firstname, Choice:choice[0].name, Description:"See choices table below for description", uid_day:uid_day, data:offerings, cutOffStudent:settings["hours_close_student"].value_int, notExcluded:true});
													});
												}
											} else {
												res.send("An Err done occured.");
											}
										});
									} else {
										// Renders the page without any choices, since the student is excluded
										res.render('student.html', {Student:student[0].firstname, Choice:"No Choice Required", Description:"Due to a sport or perhaps some other commitment, you will not participate in Oppblock today. Press Override if this doesn't apply to you.", uid_day:uid_day, oppTime:true});
									}
								} else {
									res.send("An Err done occured.");
								}
							});	
						}
					});
				} else {
					res.send("We're Sorry. You don't exist!");
				}
			} else {
				res.send("We're sorry. That wasn't a student id!");
			}
		});
	});

	app.post('/student/:id', function(req, response) {
		// checks if post request comes from an override or a choice
		if(req.body.choice != undefined) {
			// Updates Choice
			con.query('UPDATE choices SET uid_offering = ? WHERE uid_student = ? AND uid_day = ?', [req.body.choice, req.params.id, req.body.uid_day], function(err, results) {
				response.redirect('/student/' + req.params.id);
				response.end();
			});
		} else {
			// Overrides excluded group by adding student into choice table
			con.query('INSERT INTO choices (uid_offering, uid_student, uid_day) values (?, ?, ?)', [null, req.params.id, req.body.uid_day], function(err) {
				if(!err) {
					response.redirect('/student/' + req.params.id);
					response.end();
				} else {
					res.send(err);
				}
			});
		}
	});
	return this;
 }
}
