var credentials = require("./credentials.js");

var VoiceResponse = require('twilio').twiml.VoiceResponse;
var twilio = require('twilio');
var client = new twilio(credentials.accountSid, credentials.authToken);

module.exports = {
	


sendMessage: function (studentUid,number,message){
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



getStudentFromNumber:getStudentFromNumber function(studentNumber, callback){
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

compareLevenshteinDistance:function (compareTo, baseItem) {
  return new Levenshtein(compareTo, baseItem).distance;
}


getClosestOppBlock:function (input, callback){
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

makeOfferingText: function (callback){
	getAvailableOfferings(function(results){
		offerings = "";
		for (var i = 0; i < results.length; i++) {
  				offerings = offerings+"\n-"+results[i].name;
		}	
		callback(offerings);
	});
}

sendOfferingText: function (uidDay, callback){
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

}


