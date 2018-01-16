# OppBlock #
OppBlock service for St. Anne's Belfield School 

##### Creators: William Du, Hewson Duffy, Milo Last-Yuen, Johnny Lindbergh, Conrad MacKethan, and Jerry Yao

# OppBlock

OppBlock service for St. Anne's Belfield School 


## Introduction 

The purpose of this project is to streamline the OppBlock™ program while addressing some of its issues. 
### Prerequisites

To complile and run this repository, you will need:

Node.js  v6.11.3 or later (includes npm 3.10.10) 

MySQL community server v5.7 or later


### Installing

Once the Node.js is installed, the project specific dependencies can be installed very easily with the following command in the repository directory:

```
npm install
```
A new folder called `node_modules` should magically appear.

Before `server.js` can be run, the MySQL server must be formatted properly or else `server.js` won't know what is going on. To do this, log into your MySQL server with `mysql -u <YOUR_USERNAME> -p` and enter your password. You should see `mysql>`. The `CREATE_DB.sql` file can now be run to create a database with a table. **Very important:** This will automatically change your root password to `root` so that `server.js` knows how to access the MySQL server.

You can run some test queries to see if everything is functioning properly.

```INSERT INTO opp_block_day (day) VALUES ('1999-08-20'); //that's my birthday```

Now, run `server.js` by typing:

```node server.js```

The console should display the output:

```
OppBlock server listening on port 8080

