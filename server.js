
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

function createTeacher(name,teacher_info,callback){
  if (name != null && teacher_info != null){
    con.query('INSERT into teacher (name,teacher_info) values (?,?);',[name,teacher_info],function(err,results){
      callback(results);
    });
  }
}

con.end();

var server = app.listen(8080, function () {
  console.log('OppBlock server listening on port %s', server.address().port);
});
