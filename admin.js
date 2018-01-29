var con = require('./database.js').connection;
var settings = require('./settings.js');
module.exports =  {

	// initialize routes for admin backend
	// TODO: (P1) restrict access to these routes to authenticated admins only using middleware (tbd)
	init: function(app) {
		app.get("/settings", function(req, res) {
			var data = [];
			var keys = Object.keys(settings.system_settings);
			for (var i = 0; i < keys.length; i++) {	// loop through all settings
				data.push(settings.system_settings[keys[i]]);
			}
			res.render("admin_settings.html", {settings: data});
		});
		app.post("/settings", function(req, res) {
			var keys = Object.keys(req.body);
			var key_count = keys.length;	// counts the number of remaining keys to update in DB
			for(var i = 0; i < keys.length; i++) {
				settings.update(keys[i], req.body[keys[i]], function(err) {
					if (!err) {
						key_count--;
						if (key_count == 0)
							res.redirect("/settings");
					} else {
						res.end("Could not update settings -- reboot server.");
					}
				});
			}
		});

		return this;
		// Note: return this returns this module so we can do this elsewhere:
		// var admin = require('./admin.js').init(app);
		// ...which keeps things very clean
	},
	
	//add CSV file of students to database
	createStudentCSV: function(studentdata) {
		//convert giant string into array
		var a = studentdata.split("\n");	// this is an array of every line
		for (var i = 0; i < a.length; i++) {
			var b = a[i].split(",");
			b[4].trim();
	  		//add values in array to database
  			//console.log(studentdata);
  			console.log("b[0]" + b[0]);
  			console.log("b[1]" + b[1]);
  			console.log("b[2]" + b[2]);
  			console.log("b[3]" + b[3]);
  			console.log("b[4]" + b[4]);
  			con.query('INSERT INTO students(lastname, firstname, grade, gender, email) VALUES (?, ?, ?, ?, ?);', [b[0], b[1], b[2], b[3], b[4]], function(err, result) {
  				if (err) throw err;
  				console.log("1 record inserted");
  			});
		}	

  	},

  	createTeacherCSV: function(teacherdata) {
  		//var a is giant string input
  		var a = studentdata.split("\n");
  		for (var i = 0; i < a.length; i++) {
  			//var b is array of strings
  			var b = a[i].split(",");

  			//query
  			con.query('INSERT INTO teachers(prefix, teacher_firstname, teacher_lastname, teacher_email) VALUES (?, ?, ?, ?);', [b[0], b[1], b[2], b[3]], function(err, result) {
  				if (err) throw err;
  				console.log("1 record inserted");
  			});
  		}
  	},

	//create student if nothing exists in database, update student_info if something does
	createStudent: function(studentlastName, studentFirstName, studentGrade, studentSport, studentAdvisor, studentGender, studentEmail, callback) {
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
	},
	
	getExcludedStudentsOnDay: function(uidDay,callback){
		var excludedStudentUidArray = [];
		getExcludedGroupsOnDay(1, function(groups){
			con.query('SELECT uid_student FROM student_groups WHERE uid_group in (?)', [groups], function(err, results) {
					//console.log("this:  "+results);
					if (results != undefined){
						for (var i = 0; i < results.length; i++) {
							excludedStudentUidArray.push(results[i].uid_student);
						}
					} 
					callback(excludedStudentUidArray);

				});
		});
	},

	getExcludedGroupsOnDay: function(uidDay,callback){
		var excludedGroupsArray = [];
		con.query('SELECT uid_group FROM excluded_groups WHERE uid_day = ?', [uidDay], function(err, results) {

			if (results != undefined){
				for (var i = 0; i < results.length; i++) {
					excludedGroupsArray.push(results[i].uid_group);
				}
				callback(excludedGroupsArray);  
			}else{
				callback(excludedGroupsArray); 
			}    
		});
		
	},

	getUidFromValue: function (tableType, value, callback) {
		if (tableType == "teachers"){
			con.query('SELECT uid_teacher FROM teachers WHERE name = ?', [value], function(err, results) {
				if (results.length > 0){
					callback(results[0].uid_teacher);
				}else{
					callback(null); 
				}    
			});
		}

		if (tableType == "students"){
			con.query('SELECT uid_student FROM students WHERE firstname = ?', [value], function(err, results) {
				if (results.length > 0){
					callback(results[0].uid_student);
				}else{
					callback(null); 
				}    
			});
		}

		if (tableType == "opp_block_day"){
			valueFormatted = moment(value).format('YYYY-MM-DD');
			con.query('SELECT uid_day FROM opp_block_day WHERE day = ?', [valueFormatted], function(err, results) {
				if (results.length > 0){
					callback(results[0].uid_day);  
				}else{
					callback(null); 
				}     
			});
		}

		if (tableType == "offerings"){
			con.query('SELECT uid_offering FROM offerings WHERE name = ?', [value], function(err, results) {
				if (results != undefined){
					callback(results[0].uid_offering);  
				}else{
					callback(null); 
				}     
			});
		}

	},

	getExcludedStudentsOnDay: function (uidDay,callback){
		var excludedStudentUidArray = [];
		getExcludedGroupsOnDay(1, function(groups){
			con.query('SELECT uid_student FROM student_groups WHERE uid_group in (?)', [groups], function(err, results) {
				//console.log("this:  "+results);
				if (results != undefined){
					for (var i = 0; i < results.length; i++) {
						excludedStudentUidArray.push(results[i].uid_student);
					}
				} 
				callback(excludedStudentUidArray);

			});
		});
	},

	getExcludedGroupsOnDay: function (uidDay,callback){
		var excludedGroupsArray = [];
		con.query('SELECT uid_group FROM excluded_groups WHERE uid_day = ?', [uidDay], function(err, results) {

			if (results != undefined){
				for (var i = 0; i < results.length; i++) {
					excludedGroupsArray.push(results[i].uid_group);
				}
				callback(excludedGroupsArray);  
			}else{
				callback(excludedGroupsArray); 
			}    
		});

	},

	addStudentsToChoiceTable: function (uidDay){
		getExcludedStudentsOnDay(uidDay, function(students){

			con.query('SELECT uid_student FROM students WHERE uid_student NOT in (?)', [students], function(err, results) {
				if (results != undefined){
					for (var i = 0; i < results.length; i++) {
						con.query('INSERT into choices (uid_day, uid_student) values (?,?);', [uidDay, results[i].uid_student]);
					}
				}else{
					con.query('SELECT uid_student FROM students', [students], function(err, results) {
						if (results != undefined){
							for (var i = 0; i < results.length; i++) {
								con.query('INSERT into choices (uid_day, uid_student) values (?,?);', [uidDay, results[i].uid_student]);
							}	
						}    
					});
				}
			});
		});
	},








	getStudentThatNeedToChooseOffering:function (uidDay, callback){
		con.query('SELECT uid_student FROM choices WHERE uid_day = ? AND uid_offering is NULL;',[uidDay], function(err, res) { 
			callback(res);
		});
	},

	getChoice:function (uidDay, uidStudent, callback){
		con.query('SELECT uid_offering FROM choices WHERE uid_day = ? AND uid_student = ?;',[uidDay, uidStudent], function(err, res) { 
			callback(res);
		});
	}
	
	
}

