var moment = require('moment');
var con = require('./database.js').connection;
module.exports = function(app) {

    app.get('/', function(req, res) {
        //session.startSession(req, res);
        // req.session.put('info', 'myInfo', function(req,res){
        console.log(req.body.idtoken);
        res.render('login.html');
        // });
    });

    app.get('/teacher/:id', function(req, res) {
        var teacher_uid = req.params.id;
        con.query('select teachers.uid_teacher, teachers.prefix, teachers.name as teacherName, offerings.name as offeringName, offerings.uid_offering, offerings.description, offerings.max_size, offerings.recurring from teachers inner join offerings ON teachers.uid_teacher=offerings.uid_teacher where teachers.uid_teacher = ?;', [teacher_uid], function(err, resultsTeacher) {
            if (resultsTeacher.length != 0) {
                res.render('teacher.html', {
                    data: resultsTeacher,
                    teacherName: resultsTeacher[0].prefix + " " + resultsTeacher[0].teacherName,
                    teacherId: teacher_uid
                });
            } else {
                res.send("not valid teacher id!");
            }
        });
    });

    app.get('/editOffering/:id', function(req, res) {
        var offering_uid = req.params.id;
        con.query('select * from offerings where uid_offering = ?;', [offering_uid], function(err, offeringInfo) {
            if (!err) {
                con.query('select opp_block_day.uid_day, opp_block_day.day, calendar.uid_offering as "set" from opp_block_day left join calendar on opp_block_day.uid_day=calendar.uid_day and calendar.uid_offering = ? order by opp_block_day.day;', [offering_uid], function(err, dayResults) {
                    if (!err) {
                        for (var i = 0; i < dayResults.length; i++) {
                        	
                        	if (moment(dayResults[i].day).subtract(1,'days').isBefore()){
                 				dayResults[i]['canEdit'] = false;
    							
    						}else{
    							dayResults[i]['canEdit'] = true;
    						}
    						dayResults[i].day = moment(dayResults[i].day).format('MM-DD');
                            dayResults[i].set = dayResults[i].set == offering_uid ? 1 : 0;
                        }
                        res.render('offeringEdit.html', {
                            data: offeringInfo,
                            offeringId: offering_uid,
                            dayData: dayResults
                        });
                    }
                });
            } else {
                res.send("not valid offering id!");
            }
        });
    });

    app.get('/delete/:id', function(req, res) {
        var offering_uid = req.params.id;
        con.query('delete from offerings where uid_offering = ?', [offering_uid], function(err) {
            if (err) {
                console.log(err);
            } else {
                res.render("/");
            }
        });
    });

    app.post('/updateOffering/:offering_id', function(req, res) {
        var offering_id = parseInt(req.params.offering_id);
        var name = req.body.name;
        var description = req.body.description;
        var max_size = parseInt(req.body.max_size);
        var teacherId;
        var days = req.body.days;
        //console.log(req);
        var recurring = req.body.recurring == 'on' ? 1 : 0;
        con.query('select uid_teacher from offerings WHERE uid_offering = ?;', [offering_id], function(err, uid_teacher) {
            if (!err) {
                teacherId = uid_teacher[0].uid_teacher;
                if (recurring == 1) {
                    con.query('UPDATE offerings SET recurring = 0  WHERE recurring = 1 and  uid_teacher = ? and uid_offering !=? ;', [uid_teacher[0].uid_teacher, offering_id], function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
                con.query('UPDATE offerings SET name = ?, description = ?, max_size = ?, recurring = ? WHERE uid_offering = ?;', [name, description, max_size, recurring, offering_id], function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect("/teacher/" + teacherId);
                    }
                });
            }
        });

        if (days != undefined) {
                con.query('delete from calendar where uid_offering = ?;', [offering_id], function(err,result) {
                	console.log(result.affectedRows);
                   
                        for (var i = 0; i < days.length; i++) {
                            con.query('insert into calendar (uid_day, uid_offering) values (?,?);', [parseInt(days[i]), offering_id], function(err) {
                                console.log("i: " + i);
                                console.log("days[i]: " + days[i]);
                            });
                        
                    }
                });
        } else {
            con.query('delete from calendar where uid_offering = ?;', [offering_id]);
        }
    });
    //UPDATE offerings SET name=?, description = ?, max_size = ?, recurring = ?, WHERE uid_offering=?;
    //
    app.get('/add/:id', function(req, res) {
        var teacher_uid = req.params.id;
        con.query('INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("", 0, ?, 0, "");', [teacher_uid], function(err) {
            if (!err) {
                con.query('select * from offerings where uid_offering = last_insert_id();', function(err, offeringInfo) {
                    if (!err) {
                        var offering_uid = offeringInfo[0].uid_offering;
                        res.render('offeringEdit.html', {
                            data: offeringInfo,
                            offeringId: offering_uid
                        });
                    } else {
                        res.send("Oh shit!");
                    }
                });
            } else {
                res.send("not valid offering id!");
            }
        });
    });

    //CSV Post

    app.post('/csvinput', function(req,res) {
        if (res != undefined){
            CreateStudentCsv(req.body.Rad);
        }
    });
}

