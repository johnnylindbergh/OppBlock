var mysql = require('mysql');
var moment = require('moment');
var getClosest = require("get-closest");
var express = require('express');
var app = express();
var mustacheExpress = require('mustache-express');

var app = express(); 
var Levenshtein = require("levenshtein");
var VoiceResponse = require('twilio').twiml.VoiceResponse;
var twilio = require('twilio');
var credentials = require("./credentials.js");
var client = new twilio(credentials.accountSid, credentials.authToken);
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.engine('html', mustacheExpress());
//app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');
var https = require('https');

var con = mysql.createConnection({
	host: 'localhost',
	user: credentials.MySQL_username,
	password: credentials.MySQL_password,
	database: 'opp_block'
});

con.connect();

function createStudentCSV(csvfile) {
	//convert giant string into array
	csvfile = studentdata;
	studentdata.split("\n");
	studentdata.split("");
  //add values in array to database
  for (var i = 0; i < studentdata.length; i + 7) {
    conn.query('INSERT INTO students(student_lastname, student_firstname, student_grade, student_sport, student_advisor, student_gender, student_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [studentdata[i], studentdata[i+1], studentdata[i+2], studentdata[i+3], studentdata[i+4], studentdata[i+5], studentdata[i+6]], function(result) {
      callback(result);
      
//create student if nothing exists in database, update student_info if something does
function createStudent(studentlastName, studentFirstName, studentGrade, studentSport, studentAdvisor, studentGender, studentEmail, callback) {
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
}

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
			getClosestOppBlock(request.body.Body, function(input, c, OppBlockName, OppBlocks, confidence){
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

function removeOppBlock(offeringid, dayid ){
	if (dayid!=null){
	con.query('DELETE * FROM calender WHERE uid_offering=offeringid AND uid_day=dayid;', function(err, results) {
		console.log(results); 
		callback(results);
	});
	};
	if(dayid==null){
		con.query ('DELETE * FROM offerings WHERE uid_offering=offeringid;', function(err, results){
		console.log(results);
		callback(results);
		});
	};
}


function editStudent (studentid,newname,newphone){
if(newname&& newphone ){
	con.query('UPDATE students SET name=newname, phone=newphone WHERE uid_student=studentid;', function(err, results){
		console.log(results);
		callback(results);
	});
	};
if(newname == null && newphone ){
	con.query('UPDATE students SET  phone=newphone WHERE uid_student=studentid;', function(err,results){
		console.log(results);
		callback(results);
	});
};
if(newname&& newphone == null){
	con.query('UPDATE students SET name=newname WHERE uid_student=studentid;', function(err,results){
	console.log(results);		
	callback(results);
	});
	};
}


//find a way to fill in old infor here
function editOffering (offeringid, newname, newsize, newinfo, newteacherid, newrecur){
	con.query('UPDATE offerings SET name=newname, max_size=newsize, description=newinfo, uid_teacher=newteacherid, recurring=newrecur WHERE uid_offering=offeringid;', [uid_offering],function(err,results){
		console.log(results);
		callback(results);
	});
}
function getTeacherFromNumber(teacherid){
	con.query('SELECT * FROM teachers where uid_teacher=teacherid', function(err,results){
		callback(results);
		return(results);
});
}
function getOfferingFromNumber(offeringid){
	con.query('SELECT * FROM offerings where uid_offering=offeringid', function(err,results){
		callback(results);
		return(results);
});
}

function getTeacherFromNumber(teacherid){
	con.query('SELECT * FROM teachers where uid_teacher=teacherid', [uid_teacher],function(err,results){
		callback(results);
		return(results);
});
}
function getOfferingFromNumber(offeringid){
	con.query('SELECT * FROM offerings where uid_offering=offeringid',[uid_offering], function(err,results){
		callback(results);
		return(results);
});
}
function updateStudentAttendance(studentid, attendance){
	con.query('UPDATE students set arrived=attendance WHERE uid_student=studentid;',[uid_student], function(err,results){
		
		console.log(results);
		callback(results);
	});
}

function addStudentPhone(studentid, phonenum){
	 con.query('UPDATE students set phone=phonenum WHERE uid_student=studentid;',[uid_student], function(err,results){
	 	console.log(results);
		 callback(results);
	});
}

app.post('/student/edit/', function(request,reponse){
	editStudent(request.body.uid_student, request.body.newname,request.body.newphone, function(){

		response.send("student edited");

});
});

app.get('/studentInfo',function(request,reponse){
	getStudentFromNumber(request.body.uid_student, function(){
		response.render(/*info*/);
	});
});

app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));

app.post('/editOffering',function(request,reponse){
	editOffering(request.body.uid_offering,request.body.newname, request.body.newsize,request.body.newinfo,request.body.newteacherid,request.body.newnrecur,function(){
		reponse.response("new info");
	});
});


app.post('/removeOffering', function(request, reponse){
	removeOppBlock (request.body.uid_offering, request.body.uid_day, function(){
		response.end();
	
});
});
app.get('/offeringInfo', function(request, reponse){
	getOfferingFromNumber (request.body.uid_offering, function(){
		response.render(/*shows offering info and ablitity to change*/);
	
});
});
app.get('/', function(request,response){
	response.render(/*login page'*/);

});
app.get('/homepage', function(request,response){

	response.render(/*profilepage/optionspage*/);
});


//numStudents has a bug 
// function numStudents(uid_day, uid_offering, getStudentInfo, callback) {
// 	var numStud = 0;
// 	var studList = [];
// 	con.query('SELECT * FROM choices', function(err, row) {
//     if(!err) {
//       for(var i=0; i<row.length; i++) {
//         if(uid_offering == row[i].uid_offering && uid_day == row[i].uid_day) {
//           numStud += 1;
//           if(getStudentInfo) {
//             studList.push(row[i].uid_student);
//           };
//         };  
//       }
//       if(getStudentInfo) {
//         var infoList = [];    
//         con.query('SELECT * FROM students', function(err, row) {
//           if(!err) {
//             for(var i=0; i<row.length; i++) {
//               for(var j=0; j<studList.length; j++) {
//                 if(row[i].uid_student == studList[j]) {
//                   infoList.push(row[i].student_info);
//                 }
//               }
//             }
//             callback(numStud, infoList)
//           } else {
//             console.log("SELECT FROM CHOICES DONE ERRD");
//             console.log(err);
//           }
//         })
//       } else {
//         callback(numStud, null);
//       } else {
//       console.log("IT DONE ERRD");
//     } else {
//       //if something is found, update student info
//       con.query('UPDATE students SET student_lastname = ? , student_firstname, student_grade, student_sport, student_advisor, student_gender, student_email) WHERE student (uid_student = ?);', [studentLastName, studentFirstName, studentGrade, studentSport, studentAdvisor, studentGender, studentEmail, results[0].uid_student], function(result) {
//         callback(result);
//       });
//   		}
// 	}
// }
      
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
//Takes in nothing, since moment.js can give the current time and date always
//Returns two values:
//A uid_day of the coming oppblock (null if the students can't yet choose) AND
//A boolean cutOff, signifying whether the user is now past the cutoff time for students' choices
function getSoonestOppblockDay(callback) {
	con.query('SELECT * FROM opp_block_day', function(err, results){
		//Gets all Oppblock days
		if(!err){
			var uid_day = null;
			var closest = moment().add(1, y);
			for (var i=0; i<results.length; i++) {
				//Loops to find soonest Oppblock
				var curr = moment(results[i].day, 'YYYY-MM-DD');
				if(curr.isBefore(closest) && curr.isSameOrAfter(moment())) {
					closest = curr;	
					uid_day = results[i].uid_day;				
				}
			} 
			//Specficies the oppblock to 2:45 on that specific date
			closest.add({hours:14, minutes:45}); 
			//Creates Cutoff time variables relative to closest oppblock 
			var studentCutoff = closest.subtract(2, h); //12:45
			var teacherCutoff = closest.subtract({days:2, hours:14, minutes:45}); //Midnight on 2 days before current oppblock
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
	
}



app.get('/', function(req,res){
	//session.startSession(req, res);
	// req.session.put('info', 'myInfo', function(req,res){
		console.log(req.body.idtoken);
	 	res.render('login.html');
	// });
});

app.get('/teacher/:id', function(req,res){
	var teacher_uid = req.params.id;
	con.query('select teachers.uid_teacher, teachers.prefix, teachers.name as teacherName, offerings.name as offeringName, offerings.uid_offering, offerings.description, offerings.max_size, offerings.recurring from teachers inner join offerings ON teachers.uid_teacher=offerings.uid_teacher where teachers.uid_teacher = ?;',[teacher_uid],function(err, resultsTeacher) {
		if (resultsTeacher.length != 0){
			res.render('teacher.html', {data:resultsTeacher, teacherName:resultsTeacher[0].prefix+" "+resultsTeacher[0].teacherName, teacherId:teacher_uid });
		}else{
			res.send("not valid teacher id!");
		}
	});
});

app.get('/editOffering/:id', function(req,res){
	var offering_uid = req.params.id;
	con.query('select * from offerings where uid_offering = ?;',[offering_uid],function(err, offeringInfo) {
			if (offeringInfo.length != 0){
				res.render('offeringEdit.html', {data:offeringInfo,offeringId:offering_uid});
			}else{
				res.send("not valid offering id!");
			}
		});
	
});

app.get('/delete/:id', function(req,res){
	var offering_uid = req.params.id;
	con.query('delete from offerings where uid_offering = ?',[offering_uid],function(err) {
		if (err){
			console.log(err);
		}else{
			res.send("deleted");
		}
	});
});

app.post('/csvinput', function(req,res){
	if (res != undefined){
		CreateStudentCsv(req.body.Rad);
	}
});

app.post('/updateOffering/:offering_id',  function(req,res){
	var offering_id = parseInt(req.params.offering_id);
	var name = req.body.name;
	var description = req.body.description;
	var max_size = parseInt(req.body.max_size);
	var teacherId;
	var recurring = req.body.recurring == 'on' ? 1 : 0;
	console.log(recurring);
	
		con.query('select uid_teacher from offerings WHERE uid_offering = ?;',[offering_id],function(err, uid_teacher) {
						if (!err){
							teacherId = uid_teacher[0].uid_teacher;
							if (recurring == 1){
								con.query('UPDATE offerings SET recurring = 0  WHERE recurring = 1 and  uid_teacher = ? and uid_offering !=? ;',[uid_teacher[0].uid_teacher,offering_id],function(err) {
											if (err){
												console.log(err);
											}
										
								});
							}
							
							con.query('UPDATE offerings SET name = ?, description = ?, max_size = ?, recurring = ? WHERE uid_offering = ?;',[name, description, max_size, recurring, offering_id],function(err) {
											if (err){
												console.log(err);
											}else{
												res.redirect("/teacher/"+teacherId);
											}
										});

						}
					
			});	
});
//UPDATE offerings SET name=?, description = ?, max_size = ?, recurring = ?, WHERE uid_offering=?;
//
app.get('/add/:id', function(req,res){
	var teacher_uid = req.params.id;
	con.query('INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("", 0, ?, 0, "");',[teacher_uid ],function(err) {
			if (!err){
				con.query('select * from offerings where uid_offering = last_insert_id();',function(err, offeringInfo) {
						if (!err){
							var offering_uid = offeringInfo[0].uid_offering;
								res.render('offeringEdit.html', {data:offeringInfo,offeringId:offering_uid});
							}else{
								res.send("Oh shit!");
							}
						});
				
			}else{
				res.send("not valid offering id!");
			}
		});
	
});

app.get('/student/:id', function(req, res){
	//Gets Student's id from url
	var uid_student = req.params.id; 
	//This query gets the student's first name for the display page, thereby checking whether the url contained a valid uid
	con.query('SELECT firstname FROM students WHERE uid_student = ?', [uid_student], function(err, student_firstname) {
		if(!err) {
			//This function finds the upcoming oppblock, whether it is time for students to choose, and whether it is past the cutoff time
			getSoonestOppblockDay(function(uid_day, cutOff) {
				//Checks whether it is time for students to choose yet
				if (uid_day == null) { 
					res.render('student.html', {Student:uid_student, Choice:"No Choice Selected", Description:"We're sorry, but the next Oppblock choices aren't ready yet. Check back soon!", oppTime:true});
				} else {
					//Knowing there is an upcoming oppblock day with choices, the system queries to find the student's current choice 
					con.query('SELECT uid_offering FROM choices WHERE uid_student = ? AND uid_day = ?', [uid_student, uid_day], function(err, currentChoice) {
						if(!err) {
							//Checks to see if it is past the cutoff time for the students to choose
							if (cutOff) {
								//Renders the page only with the user's current choice
								res.render('student.html', {Student:uid_student, Choice:currentChoice, Description:"The time for changing choices has passed. At 2:45, head to your current choice!", oppTime:true});
							} else {
								//Gets all offerings for the user, while checking whether they are excluded from that oppblock day
								getOfferingsForStudent(uid_student, uid_day, function(offerings) {
									if(offerings == null) {
										//Renders the page without any choices, since the student is excluded
										res.render('student.html', {Student:uid_student, Choice:"No Choice Required", Description:"Due to a sport or perhaps some other commitment, you will not participate in Oppblock today. Come back later or contact an administrator if this is a mistake", oppTime:true});
									}else{
										//At last, renders the page with the current choice, and the choices table
										//Should the student's current Choice appear in the choice table (at the moment it does)?
										res.render('student.html', {Student:uid_student, Choice:currentChoice, Description:"See choices table below for description", uid_day:uid_day, data:offerings, cutOffStudent:"12:45"});
									}
								});
							}
						} else {
							res.send("An Err done occured.");
						}
					});	
				}
			});
		} else {
			res.send("We're sorry. That wasn't a student id!");
		}
	});
})
//res.render('teacher.html', {data:resultsTeacher, teacherName:resultsTeacher[0].prefix+" "+resultsTeacher[0].teacherName, teacherId:teacher_uid });
		//}else{
		//	res.send("We're Sorry. That wasn't a valid student id!");


//SELECT teachers.uid, teachers.prefix, teachers. FROM table_A  INNER JOIN table_B ON table_A.A=table_B.A;

// con.query('SELECT * FROM offerings, teachers WHERE offerings.uid_teacher = teachers.uid_teacher AND teachers.uid_teacher = ?;', [myId],function(err, results) {
// 					if (results != undefined){
// 						console.log(results);
// 						console.log(myId);
	
// 						res.render('teacher.html',{myName: JSON.stringify(results[0]), myId: myId, myOfferings: results[0].name, myOfferingsId: results[0].uid_offering});
// 					}else{
// 						console.log(results);
// 						console.log(myId);
// 						res.send("not a valid teacher id");
// 					}
// });

	

	// con.query('SELECT name, uid_offering FROM offerings WHERE uid_teacher = ?;',[myId], function(err, results) {
	// 	if (results != undefined){
	// 		for(var i=0; i<results.length; i++){
	// 				myOfferings.push(results[i].name);
	// 				myOfferingsId.push(results[i].uid_offering);
	// 		}

	// 		con.query('SELECT uid_student FROM choices WHERE uid_offering in (?);',[myId], function(err, results) {
	// 			con.query('SELECT prefix, name FROM teachers WHERE uid_teacher = ?;',[myId], function(err, results) {
	// 				if (results != undefined){
	// 					//myName = results[0].name;
	// 				}
	// 				res.render('teacher.html',{myName: myName, myId: myId, myOfferings: myOfferings, myOfferingsId: myOfferingsId});
	// 			});
	// 		});
	// 	}
	// });





var server = app.listen(80, function() {
	console.log('OppBlock server listening on port %s', server.address().port);

});

//TESTS

// saveOffering(1, 1, 1, function() {
//   isOfferingFull(1, 1, function(response){
//     console.log("Hiiiiii!");
//     console.log(response);
//   });
//   numStudents(1, 1, true, function(numStudents, infoList) {
//     console.log("number of students: " + numStudents);
//     console.log("The first name: " + infoList[0]);
//   });
// }) 
// getOfferings(1, function(response){
//   console.log(response);
// });
// con.query('SELECT day FROM opp_block_day', function(err, rows, fields) {
//  if (!err){
    
//     console.log('\nOppBlock days:')
//     for (var i in rows) {
//       var day = rows[i]["day"];
//       console.log('\t'+moment(day).format('dddd MMMM Do, YYYY [at] h:mm'));
//     }

//   }
//   else{
//     console.log('Error, are you sure you ran CREATE_DB.sql?');
//   }
// });
