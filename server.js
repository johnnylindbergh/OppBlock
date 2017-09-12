
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

function test () {
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
}




function createOffering ( name,  maxSize,  location,  materials,  recurring,  teacherName, uidTeacher) {
  if (uidTeacher == null){
  con.query('SELECT uid_teacher FROM teachers WHERE name=?', [teacherName], function(err, results) {
    results = results[0];
    var uidTeacher = results.uid_teacher;
      console.log(uidTeacher);
      con.query('INSERT into offerings (name, max_size, location, materials, uid_teacher, recurring) values (?,?,?,?,?,?);', [name, maxSize,location, materials, uidTeacher, recurring]); 
  });
  }else{
     con.query('INSERT into offerings (name, max_size, location, materials, uid_teacher, recurring) values (?,?,?,?,?,?);', [name, maxSize,location, materials, uidTeacher, recurring]); 
  }
    if (recurring){
      //do this
    }
}

createOffering("newOppBlock",2,"The CS Lab", "nothing", true, "Mr. Minster");

var server = app.listen(8080, function () {
  console.log('OppBlock server listening on port %s', server.address().port);
});
