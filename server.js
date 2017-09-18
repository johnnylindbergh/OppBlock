var mysql = require('mysql');
var moment = require('moment');
var getClosest = require("get-closest");
var express = require('express');
var app = express(); 
var Levenshtein = require("Levenshtein");
var VoiceResponse = require('twilio').twiml.VoiceResponse;
var twilio = require('twilio'); 
var client = new twilio(accountSid, authToken);
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

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

addStudentsToChoiceTable(1);

function chooseOffering(uid_day,uid_student,uid_offering, callback){
	con.query('UPDATE choices SET uid_offering = ? WHERE uid_day = ? AND uid_student = ?;', [uid_offering, uid_day, uid_student], function(err, results) {
		callback(results);   
	});
}
function sendMessage(message){
	client.messages.create({
		body: message,
		to: '+14342491362',  // Text this number
		from: '+17604627244' // From a valid Twilio number
	})
	.then((message) => console.log(message.sid));
}

app.post("/sms", function (request, response) {
	console.log(request.body.From + " says " +request.body.Body);
	response.send("<Response><Message>" + request.body.Body + "</Message></Response>");
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
	sendMessage(req.body.TranscriptionText);
	getClosestOppBlock(req.body.TranscriptionText, function(result){
		sendMessage(result);
	});

	
});

function compareLevenshteinDistance(compareTo, baseItem) {
  return new Levenshtein(compareTo, baseItem).distance;
}

function getClosestOppBlock(input, callback){
	var OppBlocks = ["SAT or ACT Math","One on One thinking games","Stab Yoga","Stab Investment Group","Open Clinic Treatments for students","Spanish TV series","Costume/set/property assistance","Art History","Nature Walk","Documentary: the minimalist","Useful Knot Series","Exploring our campus","Photojournalists-Lightroom/editing","Hispanic culture trivia competition","Jam Session","Film screening and Discussion","In season athletic performance Maintence","conversation in french","Outdoor walk","Stab Investment Group","CS Studio"];
	var c = getClosest.custom(input,OppBlocks,compareLevenshteinDistance);
	console.log(c);
	console.log(OppBlocks[c]);
	callback(OppBlock[c]);
}


var server = app.listen(8080, function() {
	console.log('OppBlock server listening on port %s', server.address().port);
});
