// DOC: system_settings
// - from anywhere in the system that includes database.js, you can access the system_settings object
// - this contains key/value pairs for all master system settings, which should be editable by admin
// - master system settings are currently created / documented in CREATE_DB.sql
// ***************************************************************************************************
// Special note: opp_days
// opp_days allows you to determine the day(s) upon which opp blocks typically occur
// if you call settings.opp_days(), the function returns a list of day objects which correspond to usual Opp days
// For easy mustache integration, each object in the list is a key/value pair following the format {weekDay: "[A Day of the Week]"}
// EXAMPLE USAGE:
// 	var settings = require('./settings');	-> Gets the settings
// 	settings.opp_days[0].weekDay			-> will return the first weekDay, for example "Tuesday", on which Oppblocks probably occur
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
		var weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		var days = [];
		var day_int = system_settings["opp_days"].value_int;
		var counter = 0;
		for (var i = 64; i > 0.5; i /= 2) {
			if (Math.floor(day_int / i) == 1){
				day_int -= i;
				days.push({weekDay: weekDays[counter], dayNum: counter});
			}
			counter += 1;
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
	system_settings: system_settings
}