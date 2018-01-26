// UNDER CONSTRUCTION
var express = require ('express');
var app = express();
var engines = require('consolidate');
var firebase = require('firebase');
app.engine('html', engines.hogan); 
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/views'));
require('firebase/auth');
require('firebase/database');
var passport = require('passport');

app.post('/login',passport.authenticate('Google'),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.redirect('/users/' + req.user.username);
});
// var config = {
//     apiKey: "AIzaSyCd7uOsM6o6J7MdaVkmfnQ6cvS8D7JUvWE",
//     authDomain: "oppblockstab.firebaseapp.com",
//     databaseURL: "https://oppblockstab.firebaseio.com",
//     projectId: "oppblockstab",
//     storageBucket: "oppblockstab.appspot.com",
//     messagingSenderId: "996448122649"
// };

// firebase.initializeApp(config);


// // function isAuthenticated(request,response,next) {
// // 	var user = firebase.auth().currentUser;
// // 	if (user ==! null){
// // 		request.user = user;
// // 		next();
// // 	}else{
// // 		var provider = new firebase.auth.GoogleAuthProvider();
// // 		firebase.auth().languageCode = 'en';
// // 		firebase.auth().signInWithPopup(provider).then(function(result){
// // 			var token = result.credential.accessToken;
// // 			var user = result.user;
// // 			console.log(user.val());
// // 			console.log(user.displayName);
// // 		}).catch(function(error){
// // 			var errorCode = error.code;
// // 			var errorMessage = error.message;
// // 			var credential = error.credential;
// // 		});
// // 	}
// // }

// app.get('/login-user', function(req, res) {
// 	var provider = new firebase.auth.GoogleAuthProvider();

// 	firebase.auth().signInWithPopup(provider).then(function(result){
// 			var token = result.credential.accessToken;
// 			var user = result.user;
// 			console.log(user.val());
// 			console.log(user.displayName);
// 			res.redirect('/')

// 		}).catch(function(error){
// 			var errorCode = error.code;
// 			var errorMessage = error.message;
// 			var credential = error.credential;
// 	});
// 	 // firebase.auth().signInWithEmailAndPassword("test@students.stab.org", "testPassword").then(function(authData){
// 	 //   	console.log('test',firebase.auth().currentUser);

// 	 // }).catch(function(error) {
// 	 //   console.log('mainError', error);
// 	 //   console.log('error', error.code);
// 	 //   console.log('message', error.message);
// 	 // });
// });

// app.get('/',function(request,response){
// 	response.render('teacher.html');
// });

// app.get('/info',function(request,response){
// 	response.render('student.html');
// });

// app.get('/check',function(req,res){
//     var user = firebase.auth().currentUser
//     alert(user)
// })


app.listen(8088);
console.log('Auth is running on port 8088');