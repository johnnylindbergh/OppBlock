var mysql = require('mysql');
var moment = require('moment');
var express = require('express');
var app = express();

var con = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'opp_block'
});

con.connect();

con.query('SELECT day from opp_block_day', function(err, rows, fields) {
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
	con.query('SELECT * FROM choices').on('data', function(row) {
		if(uid_offering == row.uid_offering && uid_day == row.uid_day) {
			numStud += 1;
			if(getStudentInfo) {
				studList.push(row.uid_student);
			};
		};
	}).on('end', function() {
		if(getStudentInfo) {
			infoList = [];		
			con.query('SELECT * FROM students WHERE uid_student in (?)', [studList]).on('data', function(row) {
				for(var i=0; i<studList.length; i++) {
          if(row.uid_student == studList[i]) {
    	  		infoList.push(row.student_info);
        		};
      		};
			}).on('end', function() {
				callback(numStud, infoList)
			})
		} else {
			callback(numStud, null);
		}
	});
}
//Function takes in an offering, returns true or false whether its full or not
function isOfferingFull(uid_day, uid_offering, callback) {
  con.query('SELECT max_size FROM offerings WHERE uid_offering = ?', [uid_offering]).on('data', function(data) {
    numStudents(uid_day, uid_offering, false, function(num, infoList){
      if(num == data) {
        callback(true);
      } else {
        callback(false);
      }    
    })
  })
}
//Function gets Offerings and their teachers from database;
//Returns list ('offerList') of Offering objects, with all necessary properties
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
  con.query('SELECT * FROM offerings').on('data', 
    function(row){
      var offerList = new Offering(row.uid_offering, row.name, row.description, row.max_size, row.recurring, row.uid_teacher);
      offerList.push(offerList.length);
    }).on('end', function() {
      con.query('SELECT * FROM teachers').on('data',
        function(row) {
          for(var i=0; i<offerList.length; i++) {
            if(row.uid_teacher == offerList[i].teacher) {
              offerList[i].teacher = row.teacher_info;
            };
          };
        }).on('end', function() {
          callback(offerList);
        })
    })
};
//takes in the student uid, offering uid and day uid
function saveOffering(day, student, offering) {
  con.query('UPDATE choices SET uid_offering = ? WHERE uid_day = ? AND uid_student = ?;', [offering, day, student]);
};
saveOffering(1, 1, 1);
numStudents(1, 1, false, function(a,b){
  console.log(a,b);
})
