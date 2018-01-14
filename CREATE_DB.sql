ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';

DROP DATABASE IF EXISTS opp_block;
CREATE DATABASE opp_block;

USE opp_block;

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
    name VARCHAR(32),
    teacher_info TEXT,
 	PRIMARY KEY (uid_teacher)
);

CREATE TABLE students (
    uid_student INT NOT NULL AUTO_INCREMENT,
    firstname VARCHAR(32),
    lastname VARCHAR(32),
    grade INT(1),
    sport VARCHAR(32),
    advisor VARCHAR(32),
    gender VARCHAR(10),
    email VARCHAR(32),
    authToken INT(1),
    phone VARCHAR(12),
    arrived TINYINT(1) DEFAULT 0,
    PRIMARY KEY (uid_student)
);

CREATE TABLE absent (
    uid_student INT,
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

CREATE TABLE choices (
    uid_day INT,
    uid_student INT,
    uid_offering INT DEFAULT NULL,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_student) REFERENCES students(uid_student),
    FOREIGN KEY (uid_offering) REFERENCES offerings(uid_offering)

);

## Test Data
 INSERT into opp_block_day (day) values ('2018-01-16');
INSERT into opp_block_day (day) values ('2018-01-19');
INSERT into opp_block_day (day) values ('2018-01-23');
INSERT into opp_block_day (day) values ('2018-01-26');
INSERT into opp_block_day (day) values ('2018-01-30');





INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Zach Minster', "Teacher info here");
INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Brian Bartholomew', "Teacher info here");
INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Andy Beardsley', "Teacher info here");
INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Bob Clark', "Teacher info here");
INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Adam Columbo', "Teacher info here");
INSERT into teachers (prefix, name, teacher_info) values ('Mr.','Jeremy Eith', "Teacher info here");
INSERT into teachers (prefix, name, teacher_info) values ('Mrs.','Sarah Moses', "Teacher info here");
INSERT into teachers (prefix, name, teacher_info) values ('Dr.','Rosanne Simeone', "Teacher info here");


INSERT into groups (group_info) values ('the lame group');
INSERT into groups (group_info) values ('the lamest group');
INSERT into groups (group_info) values ('the cool group');


##INSERT into students (info) values ('Abbott,Olivia,Grade 9,JVFieldHockey,"Shoup, Jon",Female,oabbott21@students.stab.org');
##INSERT into students (info) values ('Liu,Jay,Grade 9,BJVSoccer-W,"Bartholomew, Brian",Male,jaliu21@students.stab.org');

INSERT into student_groups (uid_student, uid_group) values (1,2);
INSERT into student_groups (uid_student, uid_group) values (2,1);

##INSERT into offerings (name, description, max_size, uid_teacher, recurring) values ("The Minster Opp Block", "In which one might drink coffee, teach comp sci, or listen to trance music.", 1, 1, 0);
-- INSERT into calender (uid_day, uid_offering) values (1,1);
-- INSERT into calender (uid_day, uid_offering) values (2,1);

INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("CS Studio", 10, 1, 0, "This OppBlock is...");
INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Mr. Minster's 2nd Offering", 15, 1, 0, "This OppBlock is...");
INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("SAT or ACT Math", 10, 2, 0, "This OppBlock is...");
INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("One on One thinking games", 10, 3, 0, "This OppBlock is...");
INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Stab Yoga", 10, 4, 1, "This OppBlock is...");
INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Stab Investment Group", 10, 5, 0, "This OppBlock is...");
INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Open Clinic Treatments for students", 10, 6, 0, "This OppBlock is...");
INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Hispanic culture trivia competition", 10, 7, 0, "This OppBlock is...");
INSERT into offerings (name, max_size, uid_teacher, recurring, description) values ("Art History", 10, 8, 1, "This OppBlock is...");




 INSERT into calendar (uid_day, uid_offering) values (1,1);
 INSERT into calendar (uid_day, uid_offering) values (2,1);
 INSERT into calendar (uid_day, uid_offering) values (4,2);
-- INSERT into calendar (uid_day, uid_offering) values (1,4);

-- INSERT into calendar (uid_day, uid_offering) values (2,5);
-- INSERT into calendar (uid_day, uid_offering) values (2,6);
-- INSERT into calendar (uid_day, uid_offering) values (2,7);
-- INSERT into calendar (uid_day, uid_offering) values (2,8);
 

-- INSERT into choices (uid_day, uid_student) values (1,1);
-- INSERT into choices (uid_day, uid_student) values (1,2);

-- UPDATE choices SET uid_offering = 1 WHERE uid_day = 1 AND uid_student = 1;

-- INSERT into choices (uid_day, uid_student ) values (2,1);
-- INSERT into choices (uid_day, uid_student ) values (2,2 );

-- UPDATE choices SET uid_offering = 1 WHERE uid_day = 2 AND uid_student = 1;
-- UPDATE choices SET uid_offering = 1 WHERE uid_day = 2 AND uid_student = 2;
