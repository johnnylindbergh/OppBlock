var mysql = require('mysql');
var moment = require('moment');
var express = require('express');
var app = express();
var parse = require('csv-parse'); //parse csv file, turn into javascript array
require('should'); //test library
var bb = require('express-busboy'); //take in file from user (in temp folder)

bb.extend(app, {
  upload: true,
  path: '/path/to/save/files', //need to designate a path in OppBlock Folder -- possibly use html to upload file in website
  allowedPath: /./
});

var con = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'opp_block'
});

con.connect();

//add CSV file of students to database
function createStudentCSV(studentList) {
  //use input if exists
  if req.files != null {
    req.files[0] = input;
  }
  else {
    println("File was not read properly");
    return;
  }
  //parse CSV using callback API
  parse(input, function(err, output){
    //use output.should.eql() to test parser
  });
  //add values in array to database
  for (var i = 0; i < output.length; i + 7) {
    conn.query('INSERT INTO students(student_lastname, student_firstname, student_grade, student_sport, student_advisor, student_gender, student_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [output[i], output[i+1], output[i+2], output[i+3], output[i+4], output[i+5], output[i+6]], function(result) {
      callback(result);
    });
  }
}

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
/*
called with
createStudent("name", function(res){

});
*/

//example student

var server = app.listen(8080, function () {
  console.log('OppBlock server listening on port %s', server.address().port);
});


//TWO FUNCTIONS: ONE FOR .CSV, ONE FOR INDIVIDUAL