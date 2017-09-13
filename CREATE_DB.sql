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
    name VARCHAR(32),
    teacher_info VARCHAR(32),
 	PRIMARY KEY (uid_teacher)
);

CREATE TABLE students (
    uid_student INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(32),
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
    name VARCHAR(32),
    max_size INT,
    location VARCHAR(32),
    materials VARCHAR(32),
    uid_teacher INT,
    recurring TINYINT(1),
    PRIMARY KEY (uid_offering),
    FOREIGN KEY (uid_teacher) REFERENCES teachers(uid_teacher)
);

CREATE TABLE calendar (
    uid_day INT,
    uid_offering INT,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_offering) REFERENCES opp_block_day(uid_day)
);

CREATE TABLE choices (
    uid_day INT,
    uid_student INT,
    uid_offering INT DEFAULT NULL,
    FOREIGN KEY (uid_day) REFERENCES opp_block_day(uid_day),
    FOREIGN KEY (uid_student) REFERENCES students(uid_student),
    FOREIGN KEY (uid_offering) REFERENCES offerings(uid_offering)

);

INSERT into opp_block_day (day) values ('1999-08-20');
INSERT into opp_block_day (day) values ('2017-09-1');
INSERT into opp_block_day (day) values ('2017-09-2');
INSERT into opp_block_day (day) values ('2017-09-3');


INSERT into teachers (name, teacher_info) values ('Mr. Minster', "he's a cool guy");

INSERT into groups (group_info) values ('the lame group');
INSERT into groups (group_info) values ('the cool group');

INSERT into excluded_groups (uid_day, uid_group) values (1,1);

INSERT into students (name) values ('Johnny');
INSERT into students (name) values ('Derp');

INSERT into student_groups (uid_student, uid_group) values (1,2);
INSERT into student_groups (uid_student, uid_group) values (2,1);

INSERT into offerings (name, max_size, uid_teacher, recurring) values ("The Minster Opp Block", 0, 1, 0);
INSERT into calendar (uid_day, uid_offering) values (1,1);
INSERT into calendar (uid_day, uid_offering) values (2,1);

INSERT into choices (uid_day, uid_student) values (1,1);
INSERT into choices (uid_day, uid_student) values (1,2);

UPDATE choices SET uid_offering = 1 WHERE uid_day = 1 AND uid_student = 1;

INSERT into choices (uid_day, uid_student ) values (2,1);
INSERT into choices (uid_day, uid_student ) values (2,2 );

UPDATE choices SET uid_offering = 1 WHERE uid_day = 2 AND uid_student = 1;
UPDATE choices SET uid_offering = 1 WHERE uid_day = 2 AND uid_student = 2;

