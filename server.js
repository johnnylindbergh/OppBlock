var mysql = require('mysql');
var moment = require('moment');
var getClosest = require("get-closest");
var express = require('express');
var mustacheExpress = require('mustache-express');
var app = express(); 
var Levenshtein = require("levenshtein");
var VoiceResponse = require('twilio').twiml.VoiceResponse;
var twilio = require('twilio');
var accountSid = 'AC390563e2e73718ab901a3f42d0ee7cae';
var authToken = '63f3451da39445dbf8ed9d8c36a472a6'; 
var client = new twilio(accountSid, authToken);
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var CLIENT_ID = '827038446996-lrrntro5hskmu9aj1jc55nrmv9090jr0.apps.googleusercontent.com';
var client = new auth.OAuth2(CLIENT_ID);
var https = require('https');



var con = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
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
	getClosestOppBlock(req.body.TranscriptionText, function(result){
		sendMessage(req.body.From, null, req.body.TranscriptionText);

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

function getAvailableOfferings(callback){
	//This will be hewson's function
	con.query('SELECT * FROM offerings;', function(err, results) { 
		callback(results);
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

 //addStudentsToChoiceTable(1);
// sendOfferingText(1, function(res){
// 	console.log(res);
// });
// getClosestOppBlock("I don't Know how this works", function(request, result, OppBlockName, OppBlocks,confidence){
// 	console.log(request+" -----> " + OppBlockName);
	

// 	console.log("Confidence: "+confidence+"%");
// })

//sendMessage(1,"Hi");



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
