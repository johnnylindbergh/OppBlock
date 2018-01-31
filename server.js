var express = require('express');
var app = express();
var mustacheExpress = require('mustache-express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var credentials = require("./credentials.js");
var con = require('./database.js');
var settings = require("./settings.js").init();
var moment = require('moment');
var getClosest = require("get-closest");
var Levenshtein = require("levenshtein");
var https = require('https');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var passport = require('passport');


var GOOGLE_CLIENT_ID      = "827038446996-lrrntro5hskmu9aj1jc55nrmv9090jr0.apps.googleusercontent.com"
  , GOOGLE_CLIENT_SECRET  = "FDN0_OJ3tM3jlfsRZYsWyGTq";


app.use( cookieParser()); 
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use( bodyParser.json());
app.engine('html', mustacheExpress());
app.set('views', __dirname + '/views');




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
    callbackURL: "http://opp.thelounge.sx/auth/google/callback",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

app.use( session({ 
	secret: 'S57uZ56o289GD02M383Ojb4PJlw64YWL',
	name:   'session',
  resave: true,
  saveUninitialized: true
}));
app.use( passport.initialize());
app.use( passport.session());


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


var admin = require("./admin.js").init(app);
var routes = require('./routes.js')(app);
var student = require("./student.js").init(app);
var auth = require("./auth.js")(app);
var roles = require("./roles.js");


app.get('/testing', function(req, res){
  res.end(JSON.stringify(req.user));
});


var server = app.listen(8980, function() {
    console.log('OppBlock server listening on port %s', server.address().port);
});



