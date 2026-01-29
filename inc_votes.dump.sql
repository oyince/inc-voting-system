PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE delegates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    token TEXT UNIQUE,
    has_voted INTEGER DEFAULT 0
, gender TEXT, community TEXT, zone TEXT, phone TEXT, email TEXT);
INSERT INTO delegates VALUES(114,'HRM Justice Tabai','INC-1-3655E884A20E',0,'','','WESTERN ZONE','','');
INSERT INTO delegates VALUES(115,'HRM King Seiyifa Koroye','INC-1-8E6DADD2A6A3',0,'','','CENTRAL ZONE','','');
INSERT INTO delegates VALUES(116,'Dr. Olobo Choice Jamaica','INC-1-75A756FE6FEA',0,'','','EASTERN ZONE','','');
INSERT INTO delegates VALUES(117,'Mrs. Iyoropatei Victoria Odogbo','INC-1-956584C77774',1,'','','WESTERN ZONE','','');
INSERT INTO delegates VALUES(118,'High Chief Joel Wodubamo Aigbekumo','INC-1-189BF684088D',1,'','','WESTERN ZONE','','');
INSERT INTO delegates VALUES(119,'Mrs. Immaculata Love Amaseimogha','INC-1-B89AB1CBF7E1',0,'','','CENTRAL ZONE','','');
INSERT INTO delegates VALUES(120,'Chief Dr. Ebizimoh Okolo','INC-1-80E1D0710BF5',0,'','','CENTRAL ZONE','','');
INSERT INTO delegates VALUES(121,'Dr. Iteimowei Major','INC-1-29AB015E29E4',0,'','','CENTRAL ZONE','','');
INSERT INTO delegates VALUES(122,'Chief Eniatorudabo Harrison','INC-1-12BABD562C30',0,'','','EASTERN ZONE','','');
INSERT INTO delegates VALUES(123,'Chief Godwin Effanga','INC-1-BCB995B8B002',0,'','','EASTERN ZONE','','');
INSERT INTO delegates VALUES(124,'Amaopusenibo Shedrack Fubara','INC-1-199182D7C302',0,'','','EASTERN ZONE ','','');
CREATE TABLE positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone TEXT,
  title TEXT,
  display_order INTEGER
);
INSERT INTO positions VALUES(1,'CENTRAL ZONE','President',1);
INSERT INTO positions VALUES(2,'CENTRAL ZONE','Vice President 3',2);
INSERT INTO positions VALUES(3,'CENTRAL ZONE','National Auditor',3);
INSERT INTO positions VALUES(4,'CENTRAL ZONE','National Publicity Secretary',4);
INSERT INTO positions VALUES(5,'CENTRAL ZONE','National Assistant Secretary',5);
INSERT INTO positions VALUES(6,'EASTERN ZONE','Vice President 2',6);
INSERT INTO positions VALUES(7,'EASTERN ZONE','National Secretary',7);
INSERT INTO positions VALUES(8,'EASTERN ZONE','National Legal Adviser',8);
INSERT INTO positions VALUES(9,'EASTERN ZONE','National Financial Secretary',9);
INSERT INTO positions VALUES(10,'EASTERN ZONE','National Welfare Secretary',10);
INSERT INTO positions VALUES(11,'WESTERN ZONE','Vice President 1',11);
INSERT INTO positions VALUES(12,'WESTERN ZONE','National Organising Secretary',12);
INSERT INTO positions VALUES(13,'WESTERN ZONE','National Treasurer',13);
INSERT INTO positions VALUES(14,'WESTERN ZONE','National Women Affairs Secretary',14);
CREATE TABLE candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_id INTEGER,
  name TEXT,
  image_url TEXT,
  display_order INTEGER, gender TEXT, community TEXT, zone TEXT,
  FOREIGN KEY (position_id) REFERENCES positions(id)
);
INSERT INTO candidates VALUES(30,1,'Prof Owei Timi','/candidates/1768471698994-672798348.jpg',4,'Male','','WESTERN ZONE');
INSERT INTO candidates VALUES(31,11,'High Chief Ayiba Tarila Zige','/candidates/1768516341001-886838063.jpg',1,'Male','','WESTERN ZONE');
INSERT INTO candidates VALUES(32,11,'Chief Doubara Fubara George','/candidates/1768516367161-525992914.jpg',2,'Male','','WESTERN ZONE');
INSERT INTO candidates VALUES(33,6,'Chief Mrs. Preye Kurotamuno','/candidates/1768516293121-15976646.jpg',1,'Female','','EASTERN ZONE');
INSERT INTO candidates VALUES(34,6,'High Chief Tamunokuro Briggs','/candidates/1768516316234-220370216.jpg',2,'Male','','EASTERN ZONE');
INSERT INTO candidates VALUES(35,2,'Chief Perewari Sokari','/candidates/1768516253638-698983430.jpg',1,'Male','','CENTRAL ZONE');
INSERT INTO candidates VALUES(36,2,'Mrs. Ebiye Timi-Owei','/candidates/1768516272858-403923962.jpg',2,'Female','','CENTRAL ZONE');
INSERT INTO candidates VALUES(37,7,'Engr. Tonye Abala Igoni','/candidates/1768516402417-843048656.jpg',1,'Male','','CENTRAL ZONE');
INSERT INTO candidates VALUES(38,7,'Engr. Ebiere Zorubo','/candidates/1768516447673-236975959.jpg',2,'Female','','EASTERN ZONE');
INSERT INTO candidates VALUES(39,12,'Engr. Diepreye Koripamo Oginah','/candidates/1768516671986-639625226.jpg',1,'Male','','WESTERN ZONE');
INSERT INTO candidates VALUES(40,12,'Barr. Tonye Daminabo','/candidates/1768516726833-339831089.jpg',2,'Female','','WESTERN ZONE');
INSERT INTO candidates VALUES(41,14,'Mrs. Ibifubara A. Zibima','/candidates/1768516788931-41648626.jpg',1,'Female','','WESTERN ZONE');
INSERT INTO candidates VALUES(42,14,'Mrs. Kikiowei R. Pepple','/candidates/1768516976762-837513770.jpg',2,'Female','','WESTERN ZONE');
INSERT INTO candidates VALUES(43,13,'High Chief Nimibofa Stanley Otobo','/candidates/1768517165832-134302213.jpg',1,'Male','','WESTERN ZONE');
INSERT INTO candidates VALUES(44,13,'Mrs. Opu-ere Georgewill','/candidates/1768517257472-779552484.jpg',2,'Female','','WESTERN ZONE');
INSERT INTO candidates VALUES(45,1,'Prof. George Tarila','/candidates/1768517346256-375037256.jpg',5,'Male','','CENTRAL ZONE');
INSERT INTO candidates VALUES(46,9,'Chief Nimibofa Abala','/candidates/1768540632355-962915580.jpg',1,'Male','','EASTERN ZONE');
INSERT INTO candidates VALUES(47,9,'Chief Mrs. Biobele Agedah','/candidates/1768540712415-959620860.jpg',2,'Female','','EASTERN ZONE');
INSERT INTO candidates VALUES(48,10,'Mrs. Tare Yerinapate Ibama','/candidates/1768540769159-550761767.jpg',1,'Female','','EASTERN ZONE');
INSERT INTO candidates VALUES(49,10,'Mrs. Ebiziemi Ogola','/candidates/1768540808408-899254396.jpg',2,'Female','','EASTERN ZONE');
INSERT INTO candidates VALUES(50,8,'Barr. Alaboh Pereotubo','/candidates/1768540953592-692321641.jpg',1,'Male','','EASTERN ZONE');
INSERT INTO candidates VALUES(51,8,'Barr. Selekaye Iniruo Erepamo','/candidates/1768540993767-359598761.jpg',2,'Male','','EASTERN ZONE');
INSERT INTO candidates VALUES(52,5,'Hon. Felicia Gogo Aprioku','/candidates/1768541096223-669577751.jpg',1,'Female','','CENTRAL ZONE');
INSERT INTO candidates VALUES(53,5,'Mrs. Tarilatei Inatimi','/candidates/1768541146128-384287546.jpg',2,'Female','','CENTRAL ZONE');
INSERT INTO candidates VALUES(54,3,'Hon. Mrs. Seiyefa Biriyai','/candidates/1768541633239-486007536.jpg',1,'Female','','CENTRAL ZONE');
INSERT INTO candidates VALUES(55,3,'High Chief Ebimene Akpowei Maciver','/candidates/1768541662362-26551735.jpg',2,'Male','','CENTRAL ZONE');
INSERT INTO candidates VALUES(56,4,'Engr. Tari Oburo','/candidates/1768541703479-322125931.jpg',1,'Male','','CENTRAL ZONE');
INSERT INTO candidates VALUES(57,4,'Engr. Ebipre Omubo','/candidates/1768541742736-392173432.jpg',2,'Male','','CENTRAL ZONE');
CREATE TABLE votes_backup(
  id INT,
  candidate TEXT,
  created_at NUM
);
INSERT INTO votes_backup VALUES(15,'Candidate A','2026-01-03 17:09:24');
INSERT INTO votes_backup VALUES(16,'Candidate B','2026-01-03 17:09:49');
INSERT INTO votes_backup VALUES(17,'Candidate A','2026-01-03 17:10:04');
INSERT INTO votes_backup VALUES(18,'Candidate B','2026-01-03 19:15:59');
CREATE TABLE votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delegate_id INTEGER,
    position_id INTEGER,
    candidate_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (delegate_id) REFERENCES delegates(id),
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
  );
INSERT INTO votes VALUES(93,117,1,30,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(94,117,2,36,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(95,117,3,54,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(96,117,4,57,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(97,117,5,52,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(98,117,6,33,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(99,117,7,37,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(100,117,8,51,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(101,117,9,47,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(102,117,10,48,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(103,117,11,32,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(104,117,12,39,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(105,117,13,43,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(106,117,14,42,'2026-01-16 05:42:13');
INSERT INTO votes VALUES(107,118,1,30,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(108,118,2,35,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(109,118,3,55,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(110,118,4,56,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(111,118,5,53,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(112,118,6,34,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(113,118,7,37,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(114,118,8,51,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(115,118,9,47,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(116,118,10,49,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(117,118,11,31,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(118,118,12,40,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(119,118,13,43,'2026-01-16 05:43:41');
INSERT INTO votes VALUES(120,118,14,42,'2026-01-16 05:43:41');
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO admin_users VALUES(1,'admin','$2b$10$evMRRMyJZ0Fkb/mKgsQsj.0o9FRjNkA35H9vmbVjvs46BHbBOxOSe','2026-01-15 03:04:07');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('delegates',124);
INSERT INTO sqlite_sequence VALUES('positions',14);
INSERT INTO sqlite_sequence VALUES('candidates',57);
INSERT INTO sqlite_sequence VALUES('votes',120);
INSERT INTO sqlite_sequence VALUES('admin_users',1);
COMMIT;
