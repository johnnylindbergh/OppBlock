

var mysql = require('mysql');
var moment = require('moment');
var express = require('express');
var app = express();

var con = mysql.createConnection({
  host     : '165.227.73.128',
  user     : 'public',
  password : 'JFC-xNc-U2x-YqN',
  database : 'opp_block'
});

con.connect();

con.query('TRUNCATE DATABASE opp_block;');
con.query('srouce CREATE_DB.sql');

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

function removeOppblock(offeringid, dayid){
	if (dayid!=null){
	con.query('DELETE * FROM calender WHERE uid_offering=offeringid AND uid_day=dayid');
	};
	if(dayid==null){
		con.query ('DELETE * FROM offerings WHERE uid_offering=offeringid');
	};
};

//function makeTeacher(name, info){
	//William got assigned this as well an his works so we're using his
//};
