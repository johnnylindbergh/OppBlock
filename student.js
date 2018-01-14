var con = require('./database.js').connection;
module.exports  = {
	
// 	chooseOffering: function(uid_day, uid_student, uid_offering, callback){
// 		con.query('UPDATE choices SET uid_offering = ? WHERE uid_day = ? AND uid_student = ?;', [uid_offering, uid_day, uid_student], function(err, results) {
// 			callback(results);   
// 		});
// 	}

// 	isOfferingFull: function (uid_day, uid_offering, callback) {
//   con.query('SELECT max_size FROM offerings WHERE uid_offering = ?', [uid_offering], function(err, data) {
//     if(!err) {
//       numStudents(uid_day, uid_offering, false, function(num, infoList){
//         if(num == data[0].max_size) {
//           callback(true);
//         } else {
//           callback(false);
//         }    
//       })
//     } else {
//       console.log("The function produced an error.");
//     }
//   })
// }

// //Function gets Offerings and their teachers on a certain day from database;
// //Returns list ('offerList') of Offering objects, with all necessary properties (although the teacher will be a Name NOT a uid)
// getOfferings: function (uid_day, callback) {
//   function Offering(uid, name, description, maxSize, recurring, teacher) {
//     this.uid = uid;
//     this.name = name;
//     this.description = description;
//     this.maxSize = maxSize;
//     this.recur = recurring;
//     this.teacher = teacher;
//   }
//   var offerList = [];
//   var trueOffers = [];
//   con.query('SELECT * FROM calender', function(err, dayList){
//     for(var i=0; i<dayList.length; i++) {
//       if(dayList[i].uid_day == uid_day) {
//         trueOffers.push(dayList[i].uid_offering);
//       }
//     }
//     con.query('SELECT * FROM offerings', function(err, rowList) {
//       if(!err) {
//         for(var i=0; i<rowList.length; i++) {
//           for(var j=0; j<trueOffers.length; j++) {
//             if(rowList[i].uid_offering == trueOffers[j]) {
//               var offering = new Offering(rowList[i].uid_offering, rowList[i].name, rowList[i].description, rowList[i].max_size, rowList[i].recurring, rowList[i].uid_teacher);
//               offerList.push(offering);
//             }
//           }
//         }
//         con.query('SELECT * FROM teachers', function(err, row) {
//           if(!err) {
//             for(var j=0; j<row.length; j++) {
//               for(var i=0; i<offerList.length; i++) {
//                 if(row[j].uid_teacher == offerList[i].teacher) {
//                   offerList[i].teacher = row[j].teacher_info;
//                 };
//               };
//             };
//             callback(offerList);
//           } else {
//             console.log("We're sorry. getOfferings() produced an error.");
//           }
//         })
//       } else {
//         console.log("We're sorry. getOfferings() produced an error.");
//       } 
//     }) 
//   })
// }
// //takes in the student uid, offering uid and day uid
// //FIX THIS ERRR
// saveOffering: function (day, student, offering, callback) {
//   con.query('UPDATE choices SET uid_offering = ? WHERE uid_day = ? AND uid_student = ?', [offering, day, student], function(err) {
//     if(!err) {
//       callback();
//     } else {
//       console.log("We're sorry. saveOffering() produced an error.");
//       console.log(err);
//     }
//   });
// }
// //Takes in student and day
// //returns True or False whether or not student is in excluded groups
// studentInExcludedGroups: function (uid_student, uid_day, callback) {
//   getExcludedStudentsOnDay(uid_day, function(students) {
//     var truth = false;
//     for(var i=0; i<students.length; i++){
//       if(uid_student == students[i]) {
//         truth = true;
//       }
//     }
//     callback(truth);
//   })
// }


// //Function takes in an Oppblock day
// //Returns a list of unfilled Offering Objects for that day
// getAvailableOfferings: function (uid_day, callback) {
//   var availableList = []
//   getOfferings(uid_day, function(response) {
//     for(var i=0; i<response.length; i++) {
//       isOfferingFull(uid_day, response[i].uid, function(truth){
//         if(truth) {
//           availableList.push(response[i]);
//         }
//       })
//     }
//     callback(availableList);
//   })
// }
// //    ;) <3
// //Function takes in a student and a day
// //Function returns a list of offerings for that specfic Student, or Null if the student is excluded
// getOfferingsForStudent : function (uid_student, uid_day, callback) {
//   studentInExcludedGroups(uid_student, uid_day, function(response){
//     if(response) {
//       callback(null);
//     } else {
//       getAvailableOfferings(uid_day, function(response){
//         callback(response);
//       })
//     }
//   })
// }

}
