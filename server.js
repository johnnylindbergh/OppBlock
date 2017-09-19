
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

//create student if nothing exists in database, update student_info if something does
function createStudent(studentName, callback) {
  con.query('SELECT uid_student FROM students WHERE student_info = ?;', [studentName], function(err, results) {
    if(results[0] == undefined) {
      //if nothing is found in database, create new student
      con.query('INSERT INTO students(student_info) VALUES (?);', [studentName], function(result) {
      callback(result);
      });
    }
    else {
      //if something is found, update student info
      con.query('UPDATE students SET student_info = ? WHERE (uid_student = ?);', [studentName, results[0].uid_student], function(result) {
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