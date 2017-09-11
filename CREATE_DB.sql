ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
DROP DATABASE IF EXISTS opp_block;
CREATE DATABASE IF NOT EXISTS opp_block;

USE opp_block;

CREATE TABLE IF NOT EXISTS opp_block_day (
    uid_day INT NOT NULL AUTO_INCREMENT,
    day DATE ,
    PRIMARY KEY (uid_day)
);

CREATE TABLE IF NOT EXISTS groups (
    uid_group INT NOT NULL AUTO_INCREMENT,
    group_info TEXT,
    PRIMARY KEY (uid_group)
);

CREATE TABLE IF NOT EXISTS excluded_groups (
    uid_day INT,
    uid_group INT,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_group) REFERENCES groups(uid_group)
);

CREATE TABLE IF NOT EXISTS teachers (
    uid_teacher INT NOT NULL AUTO_INCREMENT,
    teacher_info VARCHAR(32),
 	PRIMARY KEY (uid_teacher)
);

CREATE TABLE IF NOT EXISTS students (
    uid_student INT NOT NULL AUTO_INCREMENT,
    student_info VARCHAR(32),
    arrived TINYINT(1),
    PRIMARY KEY (uid_student)

);

CREATE TABLE IF NOT EXISTS student_groups (
    uid_student INT,
    uid_group INT,
    FOREIGN KEY (uid_student) REFERENCES students(uid_student),
    FOREIGN KEY (uid_group) REFERENCES groups(uid_group)
);

CREATE TABLE IF NOT EXISTS offerings (
    uid_offering INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(32),
    max_size INT,
    uid_teacher INT,
    recurring TINYINT(1),
    PRIMARY KEY (uid_offering),
    FOREIGN KEY (uid_teacher) REFERENCES teachers(uid_teacher)
);

CREATE TABLE IF NOT EXISTS calender (
    uid_day INT,
    uid_offering INT,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_offering) REFERENCES opp_block_day(uid_day)
);

CREATE TABLE IF NOT EXISTS choices (
    uid_day INT,
    uid_student INT,
    uid_offering INT DEFAULT NULL,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_student) REFERENCES students(uid_student),
    FOREIGN KEY (uid_offering) REFERENCES offerings(uid_offering)

);

INSERT into opp_block_day (day) values ('1999-08-20');
INSERT into opp_block_day (day) values ('2017-09-20');

INSERT into teachers (teacher_info) values ('Mr. Minster');

INSERT into groups (group_info) values ('the lame group');
INSERT into groups (group_info) values ('the cool group');

INSERT into excluded_groups (uid_day, uid_group) values (1,1);

INSERT into students (student_info) values ('Johnny');
INSERT into students (student_info) values ('William')
INSERT into students (student_info) values ('Derp');

INSERT into student_groups (uid_student, uid_group) values (1,2);
INSERT into student_groups (uid_student, uid_group) values (2,1);

INSERT into offerings (name, max_size, uid_teacher, recurring) values ("The Minster Opp Block", 0, 1, 0);
INSERT into calender (uid_day, uid_offering) values (1,1);
INSERT into calender (uid_day, uid_offering) values (2,1);

INSERT into choices (uid_day, uid_student, uid_offering) values (1,1,NULL);
INSERT into choices (uid_day, uid_student, uid_offering) values (1,2,NULL);

UPDATE choices SET uid_offering = 1 WHERE uid_day = 1 AND uid_student = 1;

INSERT into choices (uid_day, uid_student, uid_offering) values (2,1,NULL);
INSERT into choices (uid_day, uid_student, uid_offering) values (2,2,NULL);

UPDATE choices SET uid_offering = 1 WHERE uid_day = 2 AND uid_student = 1;
UPDATE choices SET uid_offering = 1 WHERE uid_day = 2 AND uid_student = 2;

