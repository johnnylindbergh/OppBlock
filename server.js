var mysql = require('mysql');
var moment = require('moment');
var getClosest = require("get-closest");
var express = require('express');
var mustacheExpress = require('mustache-express');
var app = express(); 
var Levenshtein = require("levenshtein");
var VoiceResponse = require('twilio').twiml.VoiceResponse;
var twilio = require('twilio');
var credentials = require("./credentials.js");
var client = new twilio(credentials.accountSid, credentials.authToken);
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var client = new auth.OAuth2(credentials.CLIENT_ID);
var https = require('https');



var con = mysql.createConnection({
	host: 'localhost',
	user: credentials.MySQL_username,
	password: credentials.MySQL_password,
	database: 'opp_block'
});

con.connect();

function createOffering(name, maxSize,  description, recurring, teacherName, uidTeacher, DayArray) {
	if (uidTeacher == null) {
		getUidFromValue('teachers', teacherName, function(uidTeacher){
			con.query('INSERT into offerings (name, max_size, description, uid_teacher, recurring) values (?,?,?,?,?);', [name, maxSize, description, uidTeacher, recurring], function(err, results) {
				OppBlockCalendar(name, DayArray, recurring);
			});
		});
	} else {
		con.query('INSERT into offerings (name, max_size, description, uid_teacher, recurring) values (?,?,?,?,?);', [name, maxSize, description, uidTeacher, recurring], function(err, results) {
			OppBlockCalendar(name, DayArray, recurring)
		});
	}
}

function OppBlockCalendar(name, DayArray, recurring) {
	if (!recurring) {
		if (DayArray != null){
			getUidFromValue('offerings', name, function(uid){
				for (var i = 0; i < DayArray.length; i++) {
					console.log("uid: "+uid+"  day:  "+ DayArray[i]);
					con.query('INSERT into calendar (uid_day, uid_offering) values (?,?);', [DayArray[i], uid]);
				}
			});
		}
	}
}

function getUidFromValue(tableType, value, callback) {
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
		con.query('SELECT uid_student FROM students WHERE name = ?', [value], function(err, results) {
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

}

function getExcludedStudentsOnDay(uidDay,callback){
	var excludedStudentUidArray = [];
	getExcludedGroupsOnDay(1, function(groups){
		con.query('SELECT uid_student FROM student_groups WHERE uid_group in (?)', [groups], function(err, results) {
				//console.log("this:  "+results);
				if (results != undefined){
					for (var i = 0; i < results.length; i++) {
						excludedStudentUidArray.push(results[i].uid_student);
					}
				} 
		callback(excludedStudentUidArray);

		});
	});
}

function getExcludedGroupsOnDay(uidDay,callback){
	var excludedGroupsArray = [];
	con.query('SELECT uid_group FROM excluded_groups WHERE uid_day = ?', [uidDay], function(err, results) {
 
  			if (results != undefined){
  				for (var i = 0; i < results.length; i++) {
					excludedGroupsArray.push(results[i].uid_group);
				}
				callback(excludedGroupsArray);  
			}else{
				callback(excludedGroupsArray); 
			}    
		});
	
}



function addStudentsToChoiceTable(uidDay){
	getExcludedStudentsOnDay(uidDay, function(students){

		con.query('SELECT uid_student FROM students WHERE uid_student NOT in (?)', [students], function(err, results) {
			if (results != undefined){
  				for (var i = 0; i < results.length; i++) {
					con.query('INSERT into choices (uid_day, uid_student) values (?,?);', [uidDay, results[i].uid_student]);
				}
			}else{
				con.query('SELECT uid_student FROM students', [students], function(err, results) {
					if (results != undefined){
  						for (var i = 0; i < results.length; i++) {
							con.query('INSERT into choices (uid_day, uid_student) values (?,?);', [uidDay, results[i].uid_student]);
						}	
					}    
				});
			}
		});
	});
}


function chooseOffering(uid_day,uid_student,uid_offering, callback){
	con.query('UPDATE choices SET uid_offering = ? WHERE uid_day = ? AND uid_student = ?;', [uid_offering, uid_day, uid_student], function(err, results) {
		callback(results);   
	});
}

function sendMessage(studentUid,number,message){
	if (studentUid != null){
		con.query('SELECT phone FROM students WHERE uid_student = ?;', [studentUid], function(err, results) {
			console.log(results[0].phone);
			number = results[0].phone;
			if (results != undefined){
				client.messages.create({
					body: message,
					to: number,  
					from: '+17604627244' 
				});
			}    
		});
	}else{
		getStudentFromNumber(number, function(res){
			if (res != undefined){
                                client.messages.create({
                                        body: message,
                                        to: number,  
                                        from: '+17604627244' 
                                });
                        }    

                });
        }
}



function getStudentFromNumber(studentNumber, callback){
        con.query('SELECT * FROM students WHERE phone = ?;', [studentNumber], function(err, results) {
                if (results != undefined){
                        callback(results);
                }    
        });
}

app.post("/sms", function (request, response) {
	getStudentFromNumber(request.body.From, function(res){
		if (res != undefined){
			console.log(res[0].name + " says " +request.body.Body);
			getClosestOppBlock(equest.body.Body, function(input, c, OppBlockName, OppBlocks, confidence){
				console.log("You chose: "+ OppBlockName);
				response.send("<Response><Message>You chose: " + OppBlockName + "</Message></Response>");
			});
		}    
	});
	//console.log(request.body.From + " says " +request.body.Body);
});


app.post('/voice', function(request, response){
  const twiml = new VoiceResponse();
  twiml.say('Hello. Please state Opp Block choice after the beep.');

  // Use <Record> to record and transcribe the caller's message
  twiml.record({transcribeCallback: '/transcribe',transcribe: true, maxLength: 30});

  // End the call with <Hangup>
  twiml.hangup();

  // Render the response as XML in reply to the webhook request
  response.type('text/xml');
  response.send(twiml.toString());
});

app.post('/transcribe', function(req,res){
	console.log(req.body.TranscriptionText);
	getClosestOppBlock(req.body.TranscriptionText, function(input, c, OppBlockName, OppBlocks, confidence){
		sendMessage(null, req.body.From, OppBlockName);
	});
});

function compareLevenshteinDistance(compareTo, baseItem) {
  return new Levenshtein(compareTo, baseItem).distance;
}


function getClosestOppBlock(input, callback){
	var OppBlockNames = [];
	var OppBlocks = [];
	con.query('SELECT * FROM offerings;', function(err, results) { 
		if (results != undefined){
  			for (var i = 0; i < results.length; i++) {
  				OppBlocks.push(results[i]);
  				OppBlockNames.push(results[i].name);
			}	

			var c = getClosest.custom(input,OppBlockNames,compareLevenshteinDistance);
			var OppBlockName = OppBlockNames[c];
			var maxLev = OppBlockName.length;
			var lev = compareLevenshteinDistance(input, OppBlockName);
			var confidence = ((maxLev-lev)/(maxLev))*100;
			callback(input, c, OppBlockName, OppBlocks, confidence);
		}    
	});
	
}

function makeOfferingText(callback){
	getAvailableOfferings(function(results){
		offerings = "";
		for (var i = 0; i < results.length; i++) {
  				offerings = offerings+"\n-"+results[i].name;
		}	
		callback(offerings);
	});
}

function getStudentThatNeedToChooseOffering(uidDay, callback){
	con.query('SELECT uid_student FROM choices WHERE uid_day = ? AND uid_offering is NULL;',[uidDay], function(err, res) { 
		callback(res);
	});
}

function getChoice(uidDay, uidStudent, callback){
	con.query('SELECT uid_offering FROM choices WHERE uid_day = ? AND uid_student = ?;',[uidDay, uidStudent], function(err, res) { 
		callback(res);
	});
}


function sendOfferingText(uidDay, callback){
	makeOfferingText(function(offeringText){
		getStudentThatNeedToChooseOffering(1, function(students){
			for (var i = 0; i < students.length; i++) {
  				con.query('SELECT * FROM students WHERE uid_student = ?;',[students[i].uid_student], function(err, res) { 
  					if (res[0].phone != null){
  						console.log("message to: "+res[0].name+ " Phone: "+ res[0].phone); 
  						offeringText = "Hello " +res[0].name+",\nthese are the available OppBlock offerings: "+offeringText;
  						console.log(offeringText);
						sendMessage(res[0].uid_student,null, offeringText);
					}
				});
			}	
		});
	});
}


// getClosestOppBlock("I don't Know how this works", function(request, result, OppBlockName, OppBlocks,confidence){
// 	console.log(request+" -----> " + OppBlockName);
	

// 	console.log("Confidence: "+confidence+"%");
// })

//sendMessage(null, "+14342491362","Hi");


//Function numStudents checks number of students in an offering and maybe gets their info
//takes in an offering uid, a day uid, and a boolean getStudentInfo, telling it whether to just sum the students or whether to return their information as well
//Returns
function numStudents(uid_day, uid_offering, getStudentInfo, callback) {
	var numStud = 0;
	var studList = [];
	con.query('SELECT * FROM choices', function(err, row) {
    if(!err) {
      for(var i=0; i<row.length; i++) {
        if(uid_offering == row[i].uid_offering && uid_day == row[i].uid_day) {
          numStud += 1;
          if(getStudentInfo) {
            studList.push(row[i].uid_student);
          };
        };  
      }
      if(getStudentInfo) {
        var infoList = [];    
        con.query('SELECT * FROM students', function(err, row) {
          if(!err) {
            for(var i=0; i<row.length; i++) {
              for(var j=0; j<studList.length; j++) {
                if(row[i].uid_student == studList[j]) {
                  infoList.push(row[i].student_info);
                }
              }
            }
            callback(numStud, infoList)
          } else {
            console.log("SELECT FROM CHOICES DONE ERRD");
            console.log(err);
          }
        })
      } else {
        callback(numStud, null);
      }
    } else {
      console.log("IT DONE ERRD");
    }
  })
}
//Function takes in an offering, returns true or false whether its full or not
function isOfferingFull(uid_day, uid_offering, callback) {
  con.query('SELECT max_size FROM offerings WHERE uid_offering = ?', [uid_offering], function(err, data) {
    if(!err) {
      numStudents(uid_day, uid_offering, false, function(num, infoList){
        if(num == data[0].max_size) {
          callback(true);
        } else {
          callback(false);
        }    
      })
    } else {
      console.log("The function produced an error.");
    }
  })
}
//Function gets Offerings and their teachers on a certain day from database;
//Returns list ('offerList') of Offering objects, with all necessary properties (although the teacher will be a Name NOT a uid)
function getOfferings(uid_day, callback) {
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
  con.query('SELECT * FROM calender', function(err, dayList){
    for(var i=0; i<dayList.length; i++) {
      if(dayList[i].uid_day == uid_day) {
        trueOffers.push(dayList[i].uid_offering);
      }
    }
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
        })
      } else {
        console.log("We're sorry. getOfferings() produced an error.");
      } 
    }) 
  })
};
//takes in the student uid, offering uid and day uid
//FIX THIS ERRR
function saveOffering(day, student, offering, callback) {
  con.query('UPDATE choices SET uid_offering = ? WHERE uid_day = ? AND uid_student = ?', [offering, day, student], function(err) {
    if(!err) {
      callback();
    } else {
      console.log("We're sorry. saveOffering() produced an error.");
      console.log(err);
    }
  });
}
//Takes in student and day
//returns True or False whether or not student is in excluded groups
function studentInExcludedGroups(uid_student, uid_day, callback) {
  getExcludedStudentsOnDay(uid_day, function(students) {
    var truth = false;
    for(var i=0; i<students.length; i++){
      if(uid_student == students[i]) {
        truth = true;
      }
    }
    callback(truth);
  })
}

//Function takes in an Oppblock day
//Returns a list of unfilled Offering Objects for that day
function getAvailableOfferings(uid_day, callback) {
  var availableList = []
  getOfferings(uid_day, function(response) {
    for(var i=0; i<response.length; i++) {
      isOfferingFull(uid_day, response[i].uid, function(truth){
        if(truth) {
          availableList.push(response[i]);
        }
      })
    }
    callback(availableList);
  })
}
//    ;) <3
//Function takes in a student and a day
//Function returns a list of offerings for that specfic Student, or Null if the student is excluded
function getOfferingsForStudent(uid_student, uid_day, callback) {
  studentInExcludedGroups(uid_student, uid_day, function(response){
    if(response) {
      callback(null);
    } else {
      getAvailableOfferings(uid_day, function(response){
        callback(response);
      })
    }
  })
}

app.post('/student/:day/offerings/?'/*WTH THO????*/, function(request, response) {
  saveOffering(request.params.day, request.body.student, request.body.offering, function() {
    response.render(/*SOME SUCCESSFULLY SAVED OFFERING MESSAGE*/);
  });
})

app.get('/student/:day/offerings', function(request, response) {
  getOfferingsForStudent(request.body.student, request.params.day, function(offerList) {
    if(offerList != null) {
      response.render('studOfferings.html', {student: request.body.student, day: request.params.day, offerList: offerList})
    } else {
      //What do we display if there aren't offerings (of course we could display the page without the offerList, but don't we want a message as to why there are no offerings?)
    }
  })
})

app.get('/admin/:day/offerings', function(request, response) {
  getOfferings(request.params.day, function(offerList) {
    response.render('adminOfferings.html', {day: request.params.day, offerList: offerList})
  })
})

app.get('/', function(req,res){
	console.log(req);
	res.render('login');

});

app.get('/newlogin', function(req,res){

	res.send('New User!');

});

app.get('/landingpage', function(req,res){

	console.log(req);
	res.send("profile");
});


function authenticate(req,res, callback){
	var token = req.body.idtoken;

	client.verifyIdToken(
    token,
    CLIENT_ID,


    function(e, login) {
      var payload = login.getPayload();
      var userid = payload['sub'];
      callback(payload, userid,token);

    });
}


function isLoggedIn(req,res){
	var token = req.body.idtoken;
	
	client.verifyIdToken(
    token,
    CLIENT_ID,

    function(e, login) {
      var payload = login.getPayload();
      var userid = payload['sub'];

		con.query('SELECT * FROM students WHERE name = ?',[payload['name']], function(err, result) { 
			if (result.length != 0){
				if (result[0].authToken == userid){
					return callback();
				}else{
					res.redirect('/newlogin');
				}
			}
			res.redirect('/');
			
  					
		});
	});
}


app.post('/auth', function(req,res){
	var token = req.body.idtoken;

	client.verifyIdToken(
    token,
    CLIENT_ID,

    function(e, login) {
    	console.log(login);
      var payload = login.getPayload();
      var userid = payload['sub'];
      res.send(payload['name']);
       


		// con.query('SELECT * FROM students WHERE name = ?',[payload['name']], function(err, result) { 
		// 	if (result.length != 0){
		// 		if (result[0].authToken == userid){
		// 			console.log("a");
		// 		}else{
		// 			console.log("b")
		// 		}
		// 	}
		// 		console.log("c");

  					
		// });
	});
	

});
// app.get('/auth', function(req,res){
// 	console.log("get auth");
// });

var server = app.listen(80, function() {
	console.log('OppBlock server listening on port %s', server.address().port);

});

//TESTS
/*
saveOffering(1, 1, 1, function() {
  isOfferingFull(1, 1, function(response){
    console.log("Hiiiiii!");
    console.log(response);
  });
  numStudents(1, 1, true, function(numStudents, infoList) {
    console.log("number of students: " + numStudents);
    console.log("The first name: " + infoList[0]);
  });
}) 
getOfferings(1, function(response){
  console.log(response);
});
con.query('SELECT day FROM opp_block_day', function(err, rows, fields) {
 if (!err){
    
    console.log('\nOppBlock days:')
    for (var i in rows) {
      var day = rows[i]["day"];
      console.log('\t'+moment(day).format('dddd MMMM Do, YYYY [at] h:mm'));
    }

  }
  else{
    console.log('Error, are you sure you ran CREATE_DB.sql?');
  }
});
*/