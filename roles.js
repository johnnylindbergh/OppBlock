var con  = require('./database').connection;


module.exports = {
	isLoggedIn:function(req,res,next){
		if (req.isAuthenticated()){
      return next();
		}else{
      res.redirect('/login');
    }
	},

  isAdmin:function(req,res,next){
    if (req.isAuthenticated()){
      con.query("SELECT * FROM admins WHERE email=?",[req.user.email],
        function(error, res){
          if (res !== undefined){
            res.user.isAdmin = true;
            return next(); 
          }else{
            res.user.isAdmin = false;
            res.redirect('/login');
          }
        }
      );
    }else{
      res.redirect('/login');
    }

  },

  isStudent:function(req,res,next){
    if (req.isAuthenticated()){
      con.query("SELECT * FROM students WHERE email=?",[req.user.email],
        function(error, res){
          if (res !== undefined){
            res.user.isStudent = true;
            return next(); 
          }else{
            res.user.isStudent = false;
            res.redirect('/login');
          }
        }
      );
    }else{
      res.redirect('/login');
    }
  },



  isTeacher:function(req,res,next){
    if (req.isAuthenticated()){
      con.query("SELECT * FROM teachers WHERE email=?",[req.user.email],function(error,res){
        if (res !== undefined){
          res.user.isTeacher = true;
          return next();
        }else{
          res.user.isTeaher = false;
          res.redirect('/login');
        }
      });
    }
  }


 }
