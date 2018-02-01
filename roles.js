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
    console.log("Why are you here?");
    if (req.isAuthenticated()){
      con.query("SELECT * FROM admins WHERE email=?",[req.user.email],
        function(error, row){
          console.log("ROW?");
          console.log(row);
          if (row !== undefined && row.length > 0){
            req.user.isAdmin = true;
            req.user.isStudent = false;
            req.user.isTeacher = true;
            req.user.local = row;
            return next(); 
          }else{
            res.redirect('/student');
          }
        }
      );
    }else{
      res.redirect('/auth/google');
    }

  },

  isStudent:function(req,res,next){
    if (req.isAuthenticated()){
      con.query("SELECT * FROM students WHERE email=?",[req.user.email],
        function(error, row){
          if (row !== undefined && row.length > 0){
            // TODO: should run a query to verify if this student is also an admin
            req.user.isAdmin = false;
            req.user.isStudent = true;
            req.user.isTeacher = false;
            req.user.local = row;
            return next(); 
          }else{
            res.redirect('/teacher');
          }
        }
      );
    }else{
      res.redirect('/auth/google');
    }
  },



  isTeacher:function(req,res,next){
    console.log("TEACHER AUTH");
    if (req.isAuthenticated()){
      con.query("SELECT * FROM teachers WHERE teacher_email=?",[req.user.email],function(error,row){
        console.log("ROW");
        console.log(row);
        if (row !== undefined && row.length > 0){
          console.log("SUCCESS!");
          // TODO should run a query to verify if this teacher is also an admin
          req.user.isAdmin = false;
          req.user.isStudent = false;
          req.user.isTeacher = true;
          req.user.local = row;
          return next();
        }else{
          console.log("FAIL");
          res.redirect('/student');
        }
      });
    }else{
      res.redirect('/auth/google');
    }
  }


 }
