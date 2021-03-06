const mysql = require('mysql');

// Get SQL queries
const sql_queries = require ('./queries.js');

// Connect to DB
const sql_conn = mysql.createConnection({
	host     : 'localhost',
	user	 : 'root',
	database : 'Capstone'
});

// Runs on sql connection
sql_conn.connect( function(err){
	if (err) throw err;
	console.log("Connected to DB");

	
	// Test params 
	let stud_uin = 123001234;
	let prof_uin = 999009999;
	let course_name = "CSCE_333_333";
	let date = "2018_11_05";

	// Tests for functions
	//add_student(stud_uin, "stud_first", "stud_last");
	//setTimeout( populate_course.bind(null, course_name, stud_uin), 400);
	//setTimeout( add_professor.bind(null, prof_uin, "prof_first", "prof_last"), 100);
	//setTimeout( insert_course.bind(null, course_name, prof_uin), 200);
	//setTimeout( get_courses.bind(null, prof_uin), 250);
	//setTimeout( create_attendance_table.bind(null, course_name), 300);
	//setTimeout( populate_course.bind(null, course_name, stud_uin), 400);
	//setTimeout( add_date_column.bind(null, date, course_name), 500);
	//setTimeout( update_attendance.bind(null, stud_uin, course_name, date), 600);
	//insert_course("ENGR_483_501", prof_uin);
	//create_attendance_table("ENGR_483_501");
	//get_attendance(course_name);
	//get_courses(prof_uin);
	//get_roster(course_name);
	//check_professor_exists(prof_uin);
	//update_card(prof_uin, "123");

	//update_attendance(stud_uin, course_name, date);

});

// Add new students and populate a course
function add_and_populate(uin, first, last, course_name){
	if (uin == null || uin.length == 0){
		console.log("Warning: New roster is empty");
	}
	else {
		for (let i = 0; i < uin.length; i++){
			add_student(uin[i], first[i], last[i]);
			populate_course(course_name, uin[i]);
		}
	}
}


// Add new student
function add_student(uin, first_name, last_name){

	sql_queries.add_student(uin, first_name, last_name).then(query => {
		sql_conn.query(query, function(error, results, fields){
			// Success
			if (!error) {
				console.log("\nStudent " + uin + " added");
			}
			// Duplicate
			else if (error.code == 'ER_DUP_ENTRY'){
				console.log("Warning: " + error.sqlMessage);
			}
			// Other err
			else {
				console.error(error);
			}
		});
	});

}

// Add new professor
function add_professor(uin, first_name, last_name, card){

	sql_queries.add_professor(uin, first_name, last_name).then(query => {
		sql_conn.query(query, function(error, results, fields){
			// Success
			if (!error) {
				console.log("\nProfessor " + uin + " added");
			}
			// Duplicate
			else if (error.code == 'ER_DUP_ENTRY'){
				console.log("Warning: " + error.sqlMessage);
			}
			// Other err
			else {
				console.error(error);
			}
		});
	});

}

// Assign professor to course
function insert_course(course_id, professor_uin){

	sql_queries.insert_course(course_id, professor_uin).then(query => {
		sql_conn.query(query, function(error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nCourse " + course_id + " assigned to " + professor_uin);
			}
		});
	});

}

// Creates attendance roster for a class
function create_attendance_table(class_name){

	sql_queries.create_attendance_table(class_name).then(query => {
		sql_conn.query(query, function(error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nAttendance table " + class_name + " created");
			}
		});
	});

}

// Add student to course roster
function populate_course(course_id, student_uin){

	sql_queries.populate_course(course_id, student_uin).then(query => {
		sql_conn.query(query, function(error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nStudent " + student_uin + " added to " + course_id);
			}
		});
	});

}

// Add new attendance day column to the table
function add_date_column(date, table_name){

	sql_queries.add_date_column(date, table_name).then(query => {
		sql_conn.query(query, function(error, results, fields){
			if (error) {
				if (error.code == 'ER_DUP_FIELDNAME'){
					console.log("Warning: class opened twice in one day");
				}
				else {
					console.error(error);
				}
			}
			else {
				inc_course_days(table_name);
				console.log("\nDate column " + date + " added for " + table_name);
			}
		});
	});

}

// Set student as att, increase days att, return days att
let update_attendance = (uin, course_name, date) => {
	return new Promise ((resolve, reject) => {
		check_student_already_attended(uin, course_name, date).then(attended => {
			if (!attended) {
				set_attendance(uin, course_name, date);
				inc_days_attended(uin, course_name);
			}
		});
		get_num_class_days(course_name).then(num_days => {
			get_num_attended(uin, course_name).then(num_att => {
				resolve({num_attended: num_att, num_class_days: num_days});
			});
		});
	});
}

let check_student_already_attended = (uin, course_name, date) => {
	return new Promise ((resolve, reject) => {
		sql_queries.check_student_already_attended(uin, course_name, date).then(query => {
			sql_conn.query(query, function (error, results, fields){
				if (error) {
					console.error(error);
				}
				else {
					// Already swiped for this class
					if (results[0][date] == 1){
						console.log("Warning: Student " + uin + " swiped twice in one day");
						resolve (true);
					}
					// First time
					else {
						resolve(false);
					}
				}
			});
		});
	});
}


// Set a student as present
function set_attendance(uin, course_name, date){

	sql_queries.update_attendance(uin, course_name, date).then(query => {
		sql_conn.query(query, function (error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nStudent " + uin + " has attended " + course_name + " on " + date);
			}
		});
	});

}

// Add 1 to days attended
function inc_days_attended(uin, course_name){

	sql_queries.inc_days_attended(uin, course_name).then(query => {
		sql_conn.query(query, function (error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nStudent " + uin + " attendance for " + course_name + " increased");
			}
		});
	});
	
}

// Add 1 to number of course days
function inc_course_days(course_name){

	sql_queries.inc_course_days(course_name).then(query => {
		sql_conn.query(query, function (error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nCourse " + course_name + " days increased");			
			}
		});
	});
	
}

// Get number of classes attended
let get_num_attended = (uin, course_name) =>{
	return new Promise ((resolve, reject) => {
		sql_queries.get_num_attended(uin, course_name).then(query => {
			sql_conn.query(query, function (error, results, fields){
				if (error) {
					console.error(error);
					resolve(-1);
				}
				else {
					console.log("\nStudent " + uin + " attended " + course_name + " for " + results[0].classes_attended + " days");
					resolve(results[0].classes_attended);			
				}
				
			});
		});
	});
	
}

// Get number of class days held
let get_num_class_days = (course_name) => {
	return new Promise ((resolve, reject) => {
		sql_queries.get_num_class_days(course_name).then(query => {
			sql_conn.query(query, function (error, results, fields){
				if (error) {
					console.error(error);
					resolve(-1);
				}
				else {
					console.log("\nCourse " + course_name + " held for " + results[0].num_held + " days");
					resolve(results[0].num_held);		
				}
				
			});
		});
	});
	
}

// Returns attendance table in csv
let get_attendance = (course_name) => {
	return new Promise((resolve, reject) => {
		sql_queries.get_attendance(course_name).then(query => {
			sql_conn.query(query, function (error, results, fields){
				if (error) {
					console.error(error);
					resolve(-1);
				}
				else if (results.length == 0){
					resolve(results);
				}
				else {
					console.log("\nCourse results for " + course_name + " returned");
					parse_attendance_table(results).then(csvOutput => {
						resolve(csvOutput);
					});
				}
			});
		});
	});
}

let get_courses = (uin) => {
	return new Promise ((resolve, reject) => {
		sql_queries.get_courses(uin).then(query => {
			sql_conn.query(query, function (error, results, fields){
				if (error) {
					console.error(error);
					resolve(-1);
				}
				else {
					console.log("\nUin " + uin + " logged in");
					resolve(JSON.parse(JSON.stringify(results)));
				}
			});
		});
	});
}

let get_roster = (course_name) => {
	return new Promise ((resolve, reject) => {
		sql_queries.get_roster(course_name).then(query => {
			sql_conn.query(query, function (error, results, fields){
				if (error) {
					console.error(error);
					resolve(-1);
				}
				else {
					console.log("\nSending roster for " + course_name);
					resolve(JSON.parse(JSON.stringify(results)));
				}
			})
		})
	})
}

// Update the RFID/Card of a student/prof
function update_card(uin, card){
	let isCard = false;
	let isRfid = false;

	if (uin != null && card != null){
		
		// Determine card/rfid
		if (card[0] == "m"){
			isCard = true;
		}
		else if (card[0] == "r") {
			isRfid = true;
		}
		else {
			console.log("Warning: RFID/Card has neither 'm' nor 'r'");
			return;
		}
		// Determine prof/student
		check_professor_exists(uin).then(isProf => {
			if (isProf && isRfid){
				update_professor_rfid(uin, card);
			}
			else if (isProf && isCard){
				update_professor_card(uin, card);
			}
			else {
				check_student_exists(uin).then(isStud => {
					if (isStud && isRfid){
						update_student_rfid(uin, card);
					}
					else if (isStud && isCard){
						update_student_card(uin, card);
					}
					else {
						console.log("Update_card: UIN is not found");
					}
				});
			}
		});
	}
	else {
		console.log("Warning: Update Card: UIN or card is NULL");
	}
}

let get_professors = () => {
	return new Promise ((resolve, reject) => {
		sql_queries.get_professors.then(query => {
			sql_conn.query(query, function(error, results, fields){
				if (error) {
						console.error(error);
				}
				else {
					console.log("\nReturned list of professors");
					resolve(JSON.parse(JSON.stringify(results)));
				}
			});
		});
	});
}

let check_professor_exists = (uin) => {
	return new Promise ((resolve, reject) => {
		sql_queries.check_professor_exists(uin).then(query => {
			sql_conn.query(query, function (error, results, fields){
				if (error) {
					console.error(error);
				}
				else {
					resolve(results[0]['COUNT(uin)'] >= 1);
				}
			});
		});
	});

}

let check_student_exists = (uin) => {
	return new Promise ((resolve, reject) => {
		sql_queries.check_student_exists(uin).then(query => {
			sql_conn.query(query, function (error, results, fields){
				if (error) {
					console.error(error);
				}
				else {
					resolve(results[0]['COUNT(uin)'] >= 1);
				}
			});
		});
	});
	
}


function update_student_rfid(uin, rfid){

	sql_queries.update_student_rfid(uin, rfid).then(query => {
		sql_conn.query(query, function (error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nUpdated " + uin + " rfid to " + rfid);
			}
		});
	});
	
}

function update_professor_rfid(uin, rfid){

	sql_queries.update_professor_rfid(uin, rfid).then(query => {
		sql_conn.query(query, function (error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nUpdated " + uin + " rfid to " + rfid);
			}
		});
	});
	
}

function update_student_card(uin, card){

	sql_queries.update_student_card(uin, card).then(query => {
		sql_conn.query(query, function (error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nUpdated " + uin + " card to " + card);
			}
		});
	});
	
}

function update_professor_card(uin, card){

	sql_queries.update_professor_card(uin, card).then(query => {
		sql_conn.query(query, function (error, results, fields){
			if (error) {
				console.error(error);
			}
			else {
				console.log("\nUpdated " + uin + " card to " + card);
			}
		});
	});
	
}


// Parses array of json to csv string
let parse_attendance_table = (results) => {
	return new Promise ((resolve, reject) => {
		
		// Get columns
		let columns = [];
		let csvOutput = "";
		for (let key in JSON.parse(JSON.stringify(results[0]))) {
			columns.push(key);
			csvOutput += key;
			csvOutput += ',';
		}
		csvOutput += '\n';

		// Populate table
		for (let row in results) {
			for (let index in columns){
				csvOutput += results[row][columns[index]];
				csvOutput += ',';
			}
			csvOutput += '\n';
		}
		
		resolve(csvOutput);
	});
}

module.exports = {
	add_student, add_professor, insert_course, create_attendance_table,
	populate_course, add_date_column, update_attendance, inc_days_attended,
	inc_course_days, get_num_attended, get_num_class_days, get_attendance,
	get_courses, get_roster, update_card, get_professors, check_professor_exists,
	add_and_populate
};