var mysql = require('mysql');
var moment = require('moment');
var express = require('express');
var app = express();

var con = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'mysql',
  database : 'opp_block'
});
con.connect();
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
var server = app.listen(8080, function () {
  console.log('OppBlock server listening on port %s', server.address().port);
});

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