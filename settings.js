// DOC: system_settings
// - from anywhere in the system that includes database.js, you can access the system_settings object
// - this contains key/value pairs for all master system settings, which should be editable by admin
// - master system settings are currently created / documented in CREATE_DB.sql
// ***************************************************************************************************
// Special note: opp_days
// opp_days allows you to determine the day(s) upon which opp blocks typically occur
// if you call settings.opp_days(), the function returns a list of seven boolean (true/false) values
// the array corresponds to [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
// EXAMPLE USAGE:
//	var settings = require('./settings');
//	settings.opp_days[1]					-> will be true if there's an opp block on Monday, false otherwise
//	settings.opp_days[settings.days.MONDAY]	-> built-in constants allow easier day reference if needed
// ***************************************************************************************************
// TODO: improve documentation of available system settings
// TODO: use system settings to control available views/flows as appropriate (e.g. shutting down opp block reg)
var system_settings = {};

var con = require('./database.js').connection;

module.exports = {
	init : function() {
		con.query("SELECT * FROM system_settings;", function (err, rows) {
			if (!err) {
				for (var i = 0; i < rows.length; i++) {
					system_settings[rows[i].name] = JSON.parse(JSON.stringify(rows[i]));
					// disgusting JSON stringify/parse hack avoids RowDataPacket objects mucking things up later
				}
			} else {
				console.error("FAILURE (fatal): System settings query");
			}
		}).on('end', function() {
			return this;
		});
	},
	opp_days: function() {
		var days = [];
		var day_int = system_settings["opp_days"].value_int;
		for (var i = 64; i > 0.5; i /= 2) {
			if (Math.floor(day_int / i) == 1){
				day_int -= i;
				days.push(true);
			}
			else
				days.push(false);
		}
		return days;
	},
	update: function(setting, value, cb) {
		// update settings object
		system_settings[setting].value_int = parseInt(value)
		// update database, then callback
		con.query("UPDATE system_settings SET value_int = ? WHERE sid = ?", [value, system_settings[setting].sid], function(error, results, fields) {
			cb(error);
		});
	},
	days: {
		SUNDAY: 0,
		MONDAY: 1,
		TUESDAY: 2,
		WEDNESDAY: 3,
		THURSDAY: 4,
		FRIDAY: 5,
		SATURDAY: 6
	},
	system_settings: system_settings
}