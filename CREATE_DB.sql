DROP DATABASE IF EXISTS opp_block;
CREATE DATABASE opp_block;

USE opp_block;

-- system_settings
--  stores master system settings as-needed
-- 
--  system_settings(name, value_int)
CREATE TABLE system_settings (
    `sid` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `friendly_name` VARCHAR(255),
    `description` TEXT,
    `value_int` INT,
        PRIMARY KEY (`sid`),
    UNIQUE INDEX `setting_name_UNIQUE` (`name`)
);

-- default settings
INSERT INTO system_settings (name, friendly_name, description, value_int) VALUES ("hours_close_student",
    "Student Registration Cutoff",
    "Number of hours before/after midnight on Opp Block days that the system should disallow student registration.",
    12);
INSERT INTO system_settings (name, friendly_name, description, value_int) VALUES ("hours_close_teacher",
    "Teacher Registration Cutoff",
    "Number of hours before/after midnight on Opp Block days that the system should disallow teacher registration of offerings.",
    -24);
INSERT INTO system_settings (name, friendly_name, description, value_int) VALUES ("hours_close_oppblock",
    "Start Time for Opp Block (hours, 24hr time)",
    "Number of hours after midnight on Opp Block days when the Opp Block begins, so that the system should give teachers the option to take attendance.",
    14);
INSERT INTO system_settings (name, friendly_name, description, value_int) VALUES ("minutes_close_oppblock",
    "Start Time for Opp Block (minutes)",
    "Number of minutes after midnight on Opp Block days when the Opp Block begins, so that the system should give teachers the option to take attendance.",
    45);
INSERT INTO system_settings (name, friendly_name, description, value_int) VALUES ("minutes_length_oppblock",
    "End Time for Opp Block (minutes)",
    "Duration of an Opp Block",
    50);
INSERT INTO system_settings (name, friendly_name, description, value_int) VALUES ("opp_days",
    "Opp Block Days",
    "Days of the week upon which Opp Block typically occurs.",
    18);
-- opp_days uses an unsigned binary integer representation, e.g.:
-- S/M/T/W/Th/F/Sa correspond to a 7 bit binary number
-- opp blocks on Tuesdays and Fridays means we put a 1 in those date positions
-- i.e. 0010010
-- then that gets converted to integer representation 18
-- later on when we are trying to figure out which days have opp block:
-- there is only one way to get the number 18 starting from highest
-- 18 / 64 => 0, so no Sunday opp block
-- 18 / 32 => 0, so no Monday opp block
-- 18 / 16 => 1, so there's Tuesday opp block
-- 2 / 8 => 0, so there's no Wednesday opp block
-- 2 / 4 => 0, so there's no Thursday opp block
-- 2 / 2 => 1, so there's Friday opp block
-- 0 / 1 => 0, so there's no Saturday opp block


CREATE TABLE  opp_block_day (
    uid_day INT NOT NULL AUTO_INCREMENT,
    day DATE,
    PRIMARY KEY (uid_day)
);

CREATE TABLE groups (
    uid_group INT NOT NULL AUTO_INCREMENT,
    group_info TEXT,
    PRIMARY KEY (uid_group)
);

CREATE TABLE excluded_groups (
    uid_day INT,
    uid_group INT,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_group) REFERENCES groups(uid_group)
);

CREATE TABLE teachers (
    uid_teacher INT NOT NULL AUTO_INCREMENT,
    prefix VARCHAR(4),
    teacher_firstname VARCHAR(32),
    teacher_lastname VARCHAR(32),
    teacher_email VARCHAR(32),
    teacher_info TEXT,
 	PRIMARY KEY (uid_teacher)
);

CREATE TABLE admins (
    uid_admin INT NOT NULL AUTO_INCREMENT,
    lastname VARCHAR(32),
    firstname VARCHAR(32),
    email VARCHAR(32),
    PRIMARY KEY (uid_admin)
);

CREATE TABLE students (
    uid_student INT NOT NULL AUTO_INCREMENT,
    firstname VARCHAR(32),
    lastname VARCHAR(32),
    grade INT(4),
    sport VARCHAR(32),
    advisor VARCHAR(32),
    gender VARCHAR(10),
    email VARCHAR(50),
    authToken INT(1),
    phone VARCHAR(12),
    arrived TINYINT(1) DEFAULT 0,
    PRIMARY KEY (uid_student)
);

CREATE TABLE absent (
    uid_student INT,
    uid_day INT,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_student) REFERENCES students(uid_student)
);

CREATE TABLE student_groups (
    uid_student INT,
    uid_group INT,
    FOREIGN KEY (uid_student) REFERENCES students(uid_student),
    FOREIGN KEY (uid_group) REFERENCES groups(uid_group)
);

CREATE TABLE offerings (
    uid_offering INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(64),
    location VARCHAR(64),
    description TEXT,
    max_size INT,
    uid_teacher INT,
    recurring TINYINT(1),
    PRIMARY KEY (uid_offering),
    FOREIGN KEY (uid_teacher) REFERENCES teachers(uid_teacher)
);

CREATE TABLE calendar (
    uid_day INT,
    uid_offering INT,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_offering) REFERENCES offerings(uid_offering)
);

CREATE UNIQUE INDEX day_offering_tuple ON calendar (uid_day, uid_offering);

CREATE TABLE choices (
    uid_day INT,
    uid_student INT,
    uid_offering INT DEFAULT NULL,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_student) REFERENCES students(uid_student),
    FOREIGN KEY (uid_offering) REFERENCES offerings(uid_offering)

);

#NOT TEST DATA, MANUALLY INSERTING ADMINS, DO NOT REMOVE
INSERT into admins (lastname, firstname, email) values ('Ware', 'Blake','bware@stab.org' );
INSERT into admins (lastname, firstname, email) values ('Quagliaroli','Peter', 'pquagliaroli@stab.org');
INSERT into admins (lastname, firstname, email) values ('Last-Yuen','Milo', 'mlastyuen@students.stab.org');
INSERT into admins (lastname, firstname, email) values ('MacKethan', 'Conrad','conrad.oppblock@gmail.com');
INSERT into admins (lastname, firstname, email) values ('Duffy','Hewson' ,'hduffy@students.stab.org');
INSERT into admins (lastname, firstname, email) values ('Du', 'Weiran', 'wdu@students.stab.org');
INSERT into admins (lastname, firstname, email) values ('Du', 'William', 'wdu@students.stab.org');

insert into teachers (prefix, teacher_firstname, teacher_lastname, teacher_email) values ("Mr.", "Johnny", "Lindbergh", "jlindbergh@students.stab.org");
insert into teachers (prefix, teacher_firstname, teacher_lastname, teacher_email) values ("Mr.", "Bo", "Perriello", "bperriello@stab.org");
insert into teachers (prefix, teacher_firstname, teacher_lastname, teacher_email) values ("Mr.", "Conrad", "MacKethan", "c.mackethan11@gmail.com");

## Test Data

INSERT into opp_block_day (day) values ('2018-01-26');
INSERT into opp_block_day (day) values ('2018-01-30');
INSERT into opp_block_day (day) values ('2018-02-6');
INSERT into opp_block_day (day) values ('2018-02-9');
INSERT into opp_block_day (day) values ('2018-02-13');
INSERT into opp_block_day (day) values ('2018-02-4');
INSERT into opp_block_day (day) values ('2018-02-5');





##INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Zach Minster', "Teacher info here");
##INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Brian Bartholomew', "Teacher info here");
##INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Andy Beardsley', "Teacher info here");
##INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Bob Clark', "Teacher info here");
##INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Adam Columbo', "Teacher info here");
##INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Jeremy Eith', "Teacher info here");
##INSERT into teachers (prefix, name, teacher_info) values ('Mrs.','Sarah Moses', "Teacher info here");
##INSERT into teachers (prefix, name, teacher_info) values ('Dr.','Rosanne Simeone', "Teacher info here");
##INSERT into teachers (prefix, name, teacher_info) values ('N/A', 'Weiran Du', 'Teacher info here');

INSERT into groups (group_info) values ('the lame group');
INSERT into groups (group_info) values ('the lamest group');
INSERT into groups (group_info) values ('the cool group');


INSERT into students (lastname, firstname, grade) values ("Last-Yuen", "Milo", 11);
INSERT into students (lastname, firstname, grade) values ("Du", "Weiran", 11);
INSERT into students (lastname, firstname, grade) values ("Duffy", "Hewson", 10);
INSERT into students (lastname, firstname, grade) values ("Lindbergh", "Johnny", 12);
INSERT into students (lastname, firstname, grade) values ("Yao", "Jerry", 12);
INSERT into students (lastname, firstname, grade, gender, email) values ("MacKethan", "Conrad", 12, "Male", "conrad.oppblock@gmail.com");
INSERT into students (lastname, firstname, grade) values ("Minster", "Zach", 12);
##INSERT into students (info) values ('Liu,Jay,Grade 9,BJVSoccer-W,"Bartholomew, Brian",Male,jaliu21@students.stab.org');


-- INSERT into student_groups (uid_student, uid_group) values (1,2);
-- INSERT into student_groups (uid_student, uid_group) values (2,1);


##INSERT into offerings (name, description, max_size, uid_teacher, recurring) values ("The Minster Opp Block", "In which one might drink coffee, teach comp sci, or listen to trance music.", 1, 1, 0);INSERT into calender (uid_day, uid_offering) values (1,1);
-- INSERT into calender (uid_day, uid_offering) values (2,1);

INSERT into offerings (name, location,  max_size, uid_teacher, recurring, description) values ("Johnny's OppBlock", 'somewhere', 10, 1, 0, "This OppBlock is...");
INSERT into calendar (uid_day, uid_offering) values (7,1);
##INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Mr. Minster's 2nd Offering", 15, 1, 0, "This OppBlock is...");
##INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("SAT or ACT Math", 10, 2, 0, "This OppBlock is...");
##INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("One on One thinking games", 10, 3, 0, "This OppBlock is...");
##INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Stab Yoga", 10, 4, 1, "This OppBlock is...");
##INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Stab Investment Group", 10, 5, 0, "This OppBlock is...");
##INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Open Clinic Treatments for students", 10, 6, 0, "This OppBlock is...");
##INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Hispanic culture trivia competition", 10, 7, 0, "This OppBlock is...");
##INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Art History", 10, 8, 1, "This OppBlock is...");

 ##INSERT into calendar (uid_day, uid_offering) values (1,1);
 ##INSERT into calendar (uid_day, uid_offering) values (2,1);
 ##INSERT into calendar (uid_day, uid_offering) values (3,1);
 ##INSERT into calendar (uid_day, uid_offering) values (4,1);
 ##INSERT into calendar (uid_day, uid_offering) values (1,2);
 ##INSERT into calendar (uid_day, uid_offering) values (2,2);
 ##INSERT into calendar (uid_day, uid_offering) values (3,2);
 ##INSERT into calendar (uid_day, uid_offering) values (4,2);
 ##INSERT into calendar (uid_day, uid_offering) values (1,3);
 ##INSERT into calendar (uid_day, uid_offering) values (2,3);
 ##INSERT into calendar (uid_day, uid_offering) values (3,3);
 ##INSERT into calendar (uid_day, uid_offering) values (4,3);


-- INSERT into calendar (uid_day, uid_offering) values (1,4);

-- INSERT into calendar (uid_day, uid_offering) values (2,5);
-- INSERT into calendar (uid_day, uid_offering) values (2,6);
-- INSERT into calendar (uid_day, uid_offering) values (2,7);
-- INSERT into calendar (uid_day, uid_offering) values (2,8);
 

 #INSERT into choices (uid_day, uid_student, uid_offering) values (1,1,1);
 #INSERT into choices (uid_day, uid_student, uid_offering) values (1,2,1);

-- UPDATE choices SET uid_offering = 1 WHERE uid_day = 1 AND uid_student = 1;

-- INSERT into choices (uid_day, uid_student ) values (2,1);
-- INSERT into choices (uid_day, uid_student ) values (2,2 );

-- UPDATE choices SET uid_offering = 1 WHERE uid_day = 2 AND uid_student = 1;
-- UPDATE choices SET uid_offering = 1 WHERE uid_day = 2 AND uid_student = 2;