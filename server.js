
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

con.end();

var server = app.listen(8080, function () {
  console.log('OppBlock server listening on port %s', server.address().port);
});
//Function gets Offerings and their teachers from database;
//Returns list ('offerList') of Offering objects, with all necessary properties
function getOfferings() {
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
      var offerList.size() = new Offering(row.uid_offering, row.name, row.description, row.max_size, row.recurring, row.uid_teacher);
      offerList.push(offerList.size());
    }).on('end', function() {
      con.query('SELECT * FROM teachers').on('data',
        function(row) {
          for(var i=0; i<offerList.size(); i++) {
            if(row.uid_teacher == offerList[i].teacher) {
              offerList[i].teacher = row.teacher_info;
            };
          };
        }).on('end', function() {
          return offerList;
        })
    })
};
//takes in the student uid, offering uid and day uid
function saveOffering(day, student, offering) {
  con.query('INSERT INTO choices (uid_day, uid_student, uid_offering) VALUES ($1, $2, $3)', [day, student, offering]);
};