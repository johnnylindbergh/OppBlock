var mysql = require('mysql');
var creds = require('./credentials.js');

var con = mysql.createConnection({
    host: 'localhost',
    user: creds.MySQL_username,
    password: creds.MySQL_password,
    database: 'opp_block'
});

// DOC: system_settings
// - from anywhere in the system that includes database.js, you can access the system_settings object
// - this contains key/value pairs for all master system settings, which should be editable by admin
// - master system settings are currently created / documented in CREATE_DB.sql
// TODO: improve documentation of available system settings
// TODO: use system settings to control available views/flows as appropriate (e.g. shutting down opp block reg)
var system_settings = {};

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
		});
	},
	connection : con,
	system_settings: system_settings
}
