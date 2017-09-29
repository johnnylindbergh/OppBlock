var mysql = require('mysql');
var moment = require('moment');
var express = require('express');
var app = express();
var parse = require('csv-parse');
require('should');

var con = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'opp_block'
});

con.connect();

function createStudentCSV(studentList) {
  var input = //input

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

createStudent("Conrad Mackethan", function(result) {
});

createStudent("Quint McNeely", function(result) {
});

var server = app.listen(8080, function () {
  console.log('OppBlock server listening on port %s', server.address().port);
});


//TWO FUNCTIONS: ONE FOR .CSV, ONE FOR INDIVIDUAL