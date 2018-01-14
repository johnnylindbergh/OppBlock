var con = require('./database.js').connection;
var settings = require('./database.js').system_settings;
module.exports =  {

	// initialize routes for admin backend
	// TODO: (P1) restrict access to these routes to authenticated admins only using middleware (tbd)
	init: function(app) {
		app.get("/settings", function(req, res) {
			var data = [];
			var keys = Object.keys(settings);
			for (var i = 0; i < keys.length; i++) {	// loop through all settingsg
				data.push(settings[keys[i]]);
			}
			res.render("admin_settings.html", {settings: data});
		});
		app.post("/settings", function(req, res) {
			var keys = Object.keys(req.body);
			for(var i = 0; i < keys.length; i++) {
				// update settings object
				settings[keys[i]].value_int = parseInt(req.body[keys[i]]);
				// update database
				con.query("UPDATE system_settings SET value_int = ? WHERE sid = ?", [req.body[keys[i]], settings[keys[i]].sid] );
			}
			res.redirect("/settings");
		});

		return this;
		// Note: return this returns this module so we can do this elsewhere:
		// var admin = require('./admin.js').init(app);
		// ...which keeps things very clean
	},
	
	//add CSV file of students to database

	createStudentCSV: function(csvfile) {
		//convert giant string into array
		csvfile = studentdata;
		studentdata.split("\n");
		studentdata.split("");
  		//add values in array to database
  		for (var i = 0; i < studentdata.length; i + 7) {
  			conn.query('INSERT INTO students(student_lastname, student_firstname, student_grade, student_sport, student_advisor, student_gender, student_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [studentdata[i], studentdata[i+1], studentdata[i+2], studentdata[i+3], studentdata[i+4], studentdata[i+5], studentdata[i+6]], function(result) {
  				callback(result);
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

