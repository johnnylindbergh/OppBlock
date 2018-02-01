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
    if (req.isAuthenticated() && req.user.isAdmin)
      return next();
    }else{
      res.redirect('/auth/google');
    }
  },

  isStudent:function(req,res,next){
    if (req.isAuthenticated() && req.user.isStudent)
      return next();
    }else{
      res.redirect('/auth/google');
    }
  },



  isTeacher:function(req,res,next){
    if (req.isAuthenticated() && req.user.isTeacher)
      return next();
    }else{
      res.redirect('/auth/google');
    }
  }


 }
