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
saveOffering(0, 1, 1, function() {
  isOfferingFull(0, 1, function(response){
    console.log("Hiiiiii!");
    console.log(response);
  });
  numStudents(0, 1, true, function(numStudents, infoList) {
    console.log("number of students: " + numStudents);
    console.log("The first name: " + infoList[0]);
  });
})
getOfferings(function(response){
  console.log(response[0]);
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
        //FIX THIS ERR
        con.query('SELECT * FROM students WHERE uid_student IN (?)', [studList], function(err, row) {
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
        if(num == data) {
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
//Function gets Offerings and their teachers from database;
//Returns list ('offerList') of Offering objects, with all necessary properties (although the teacher will be a Name NOT a uid)
function getOfferings(callback) {
  function Offering(uid, name, description, maxSize, recurring, teacher) {
    this.uid = uid;
    this.name = name;
    this.description = description;
    this.maxSize = maxSize;
    this.recur = recurring;
    this.teacher = teacher;
  }
  var offerList = [];
  con.query('SELECT * FROM offerings', function(err, row){
      if(!err) {
        for(var i=0; i<row.length; i++) {
          var offering = new Offering(row[i].uid_offering, row[i].name, row[i].description, row[i].max_size, row[i].recurring, row[i].uid_teacher);
          offerList.push(offering);
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
};
//takes in the student uid, offering uid and day uid
//FIX THIS ERRR
function saveOffering(day, student, offering, callback) {
  con.query('UPDATE choices uid_day, uid_student, uid_offering VALUES $1, $2, $3', [day, student, offering], function(err) {
    if(!err) {
      callback();
    } else {
      console.log("We're sorry. saveOffering() produced an error.");
      console.log(err);
    }
  });
};