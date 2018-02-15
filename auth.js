

module.exports = function(app){



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

app.get('/logout', function(req,res){
	req.logout();
	res.redirect('/');
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

