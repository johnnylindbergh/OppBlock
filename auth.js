
var util = require('util');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var con  = require('./database').connection;

var GOOGLE_CLIENT_ID      = "905388552359-p7i0l15pvkefgfn59ch3t1gsqtfu1qdi.apps.googleusercontent.com"
  , GOOGLE_CLIENT_SECRET  = "IVQF9031DSqYr6WSqOtdGXXH";


module.exports = function(app){

app.set('view engine', 'ejs');

var passport = require('passport');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  user.isStudent = false;
  user.isTeacher = false;
  user.isAdmin = false;
  // user.teacher_uid = null;
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/google/callback",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

app.use( cookieParser()); 
app.use( bodyParser.json());
app.use( bodyParser.urlencoded({
	extended: true
}));
app.use( session({ 
	secret: 'S57uZ56o289GD02M383Ojb4PJlw64YWL',
	name:   'session',
  resave: true,
  saveUninitialized: true
}));
app.use( passport.initialize());
app.use( passport.session());

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  console.log(req.user._raw);
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});


app.get('/auth/google', passport.authenticate('google', { scope: [
       'https://www.googleapis.com/auth/userinfo.profile',
       'https://www.googleapis.com/auth/userinfo.email'] 
}));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get( '/auth/google/callback', 
    	passport.authenticate( 'google', { 
    		successRedirect: '/test',
    		failureRedirect: '/failure'
}));

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/test',function(req,res){
  console.log(req.user);
  //check role
  //add variables for a teacher/admin/student
  


});

app.get('/secretpage', ensureAuthenticated, function(req, res) {
  res.end("This page is secret.");
});

app.get('/testaccountinfo',function(req,res){
   res.end(req.user.domain);
});

}

//server.listen( 8080 );


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

