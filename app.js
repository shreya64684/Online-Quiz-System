const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const port = 5000;
require("dotenv").config();
const path = require("path");
const crypto = require('crypto');
const router = express.Router();
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const mysql2 = require('mysql2');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const connection = mysql2.createConnection({
  host: '127.0.0.1',   // Your MySQL server host
  user: 'root',
  password: '',
  database: 'quizz',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL');

});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/main.html');
});

app.get('/teacher_login.html', (req, res) => {
  res.sendFile(__dirname + '/teacher_login.html');
})

app.get('/student_login', (req, res) => {
  res.sendFile(__dirname + '/student_login.html');
})

app.get('/index3.html', (req, res) => {
  res.sendFile(__dirname + '/index3.html');
});

app.get('/add_data.html', (req, res) => {
  res.sendFile(__dirname + '/add_data.html');
});

app.get('/teacher_profile.html', (req, res) => {
  res.sendFile(__dirname + '/teacher_profile.html');
});

app.get('/student_profile.html', (req, res) => {
  res.sendFile(__dirname + '/student_profile.html');
});

app.get('/new_test.html', (req, res) => {
  res.sendFile(__dirname + '/new_test.html');
});

app.get('/index2.html', (req, res) => {
  res.sendFile(__dirname + '/index2.html');
});

app.get('/teacher_dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'teacher_dashboard.html'));
});

app.get('/student_dashboard.html', (req, res) => {
  res.sendFile(__dirname + '/student_dashboard.html');
});

app.get('/test_details.html', (req, res) => {
  res.sendFile(__dirname + '/test_details.html');
});

app.get('/student_test_credentials.html' , (req,res) => {
  res.sendFile(__dirname + '/student_test_credentials.html');
});

app.get('/fetchTestStatus', (req, res) => {
  //Replace this with your database query to fetch test statuses
  // connection.query('SELECT id, name FROM status', (err, rows) => {
  //   if (err) {
  //     console.error('Error fetching test statuses:', err);
  //     res.status(500).json({ error: 'Error fetching test statuses' });
  //   } else {
  //     res.json({ testStatuses: rows });
  //   }
  // });

  // 
  connection.query('SELECT id, name FROM status', (err, results) => {
    if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error fetching test statuses' });
    }

    const testStatuses = results; // Assuming the results directly contain the ID and name
    testStatuses.forEach(status => {
      // console.log(`Status ID: ${status.id}, Name: ${status.name}`);
  });
    res.json({ testStatuses });
});

});

app.get('/fetchClasses', (req, res) => {
  // Replace this with your database query to fetch classes
  connection.query('SELECT id, name FROM classes', (err, rows) => {
    if (err) {
      console.error('Error fetching classes:', err);
      res.status(500).json({ error: 'Error fetching classes' });
    } else {
      res.json({ classes: rows });
    }
  });
});


app.get('/getTests', (req, res) => {
  const user_id = 1; // Assuming you have the teacher's user ID in the session

  // Query to fetch test data for a specific teacher
  const sql = `
    SELECT id, name, subject, date
    FROM tests
    WHERE teacher_id = ?
      AND status_id IN (1, 2)
  `;

  connection.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching test data: ' + err);
      res.status(500).json({ error: 'Error fetching test data' });
    } else {
      res.json(results);
    }
  });
});

// Define a route to fetch test details by test ID
app.get('/api/getTestDetails/:testId', (req, res) => {
  const testId = req.params.testId;
  console.log(testId);
  // const testId = 3;
  // Query the database to fetch test details
  const sql = 'SELECT name, subject, date, total_questions FROM tests WHERE id = ?';
  connection.query(sql, [testId], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      res.status(500).json({ error: 'Error fetching test details' });
    } else if (results.length === 0) {
      res.status(404).json({ error: 'Test not found' });
    } else {
      // Assuming the database query was successful
      const testDetails = results[0];
      res.json(testDetails);
    }
  });
});

app.get('/getStudentData/:testId', (req, res) => {
  const testId = req.params.testId ;

  
})


app.get('/fetch-questions/:testId', (req, res) => {
  const testId = req.params.testId;
  console.log(testId);
  // Assuming you have a database connection

  const sql = `SELECT questions.* FROM questions
              INNER JOIN question_test_mapping ON questions.id = question_test_mapping.question_id
              WHERE question_test_mapping.test_id = ?`;

  connection.query(sql, [testId], (err, results) => {
      if (err) {
          console.error('Error fetching questions:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.json(results);
      }
  });
});

app.use("/public", express.static("public"));

const sessionStoreOptions = {
  host: '127.0.0.1',
  port: 3306, // Default MySQL port
  user: 'root',
  password: '',
  database: 'quizz', // The name of your database
};

const sessionOptions = {
  secret: 'your-secret-key', // Change this to a secure secret
  resave: false,
  saveUninitialized: true,
  store: new MySQLStore(sessionStoreOptions),
};

app.use(session(sessionOptions));

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log()
  const enc_password = crypto.createHash('sha256').update(password).digest('hex');

  const sql = 'SELECT * FROM teachers WHERE email = ? AND password = ?';

  connection.execute(sql, [username, enc_password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ message: 'Database error' });
    } else if (results.length === 1) {
      // res.status(200).json({ message: 'success' });
      req.session.teacher_id = results[0].id;
      console.log(req.session.teacher_id);
      res.redirect('/teacher_dashboard.html');
      // Initialize the session if login is successful
      // req.session.user_id = results[0].id;
    } else {
      res.status(200).json({ message: 'fail' });
    }
  });
  
});

app.post('/student_login', (req, res) => {
  const student_roll_number = req.body.rollNumber;
  const student_password = req.body.studentpassword;

  const sql1 = 'SELECT id FROM student_data WHERE rollno = ?';
  
  connection.execute(sql1, [student_roll_number], (err, results1) => {
    console.log(student_roll_number)
    console.log(results1);
    if (err) {
      console.error('Error querying student_data:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results1.length === 0) {
      return res.status(200).json({ message: 'STUDENT_RECORD_NOT_FOUND 1' });
    }

    const student_id = results1[0].id;
    console.log(student_id);
    const sql2 = 'SELECT id, test_id, rollno, score, status FROM students WHERE rollno = ? AND password = ? AND status = 0';
    
    connection.execute(sql2, [student_id, student_password], (err, results2) => {
      console.log(student_id);
      console.log(student_password);
      if (err) {   //9hFqUDx3
        console.error('Error querying students:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      console.log(results2);
      if (results2.length === 0) {
        return res.status(200).json({ message: 'STUDENT_RECORD_NOT_FOUND' });
      }

      // If login is successful, redirect to student dashboard
      res.redirect('/student_dashboard.html');
    });
  });
});

  


// app.post('/student_login', (req, res) => {
//   const student_roll_number = req.body.rollNumber;
//   const student_password = req.body.studentpassword;
//   console.log(student_roll_number);
//   console.log(student_password);
//   const sql1 = 'SELECT id, password FROM student_data WHERE rollno = ?';
  
//   connection.execute(sql1, [student_roll_number], (err, results) => {
//     if (err) {
//       console.error('Error querying student_data:', err);
//       res.status(500).json({ message: 'Database error' });
//       return;
//     }
//     if (results.length > 0) {
//       const stored_password = results[0].password;
//       console.log(stored_password); 
//       // Compare the plain-text password provided by the user with the password stored in the database
//       if (student_password === stored_password) {
//         // Redirect to student dashboard upon successful login
//         res.redirect('/student_dashboard.html');
//       } else {
//         // Password provided by the user does not match the password stored in the database
//         res.status(200).json({ message: 'INVALID_PASSWORD' });
//       }
//     } else {
//       // No student found with the provided roll number
//       res.status(200).json({ message: 'STUDENT_RECORD_NOT_FOUND' });
//     }
//   });
// });
app.get('/teacher_dashboard', (req, res) => {
  const teacher_id = req.session.teacher_id;
  console.log(teacher_id);
  // Use teacher_id to fetch teacher-specific data from your database

  // Example: Fetch teacher data using teacher_id
  const sql = 'SELECT * FROM teachers WHERE id = ?';
  connection.execute(sql, [teacher_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 1) {
      const teacherData = results[0];
      // Send the teacherData to the teacher dashboard template
      // res.render('teacher_dashboard', { teacherData });
    } else {
      return res.status(404).json({ message: 'Teacher not found' });
    }
  });
});


const classesRoute = require('./routes/classes');
app.use('/classes', classesRoute);

app.post('/add_data', (req, res) => {
  const className = req.body.class_name;
  const startingRollNumber = req.body.starting_roll_number;
  const endingRollNumber = req.body.ending_roll_number;

  // Insert class data into the 'classes' table
  const sql = `INSERT INTO classes (name) VALUES (?)`;
  connection.query(sql, [className], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error creating class');
    }

    const classId = result.insertId;

    // Insert student data into the 'student_data' table
    for (let rollNumber = startingRollNumber; rollNumber <= endingRollNumber; rollNumber++) {
      const studentSql = 'INSERT INTO student_data (rollno, class_id) VALUES (?, ?)';
      connection.query(studentSql, [rollNumber, classId], (studentErr) => {
        if (studentErr) {
          console.error(studentErr);
          return res.status(500).send('Error creating students');
        }
      });
    }

    return res.status(200).send('Class and students added successfully');
  });
});

app.post('/add-extra-student', (req, res) => {
  // const { class_name, extra_roll_number } = req.body;
  const class_name = req.body.class_name;
  const extra_roll_number = req.body.extra_roll_number;
  console.log(class_name);
  console.log(extra_roll_number);
  connection.connect();

  // Directly use class_id from the request instead of querying it from the classes table
          const class_id = class_name;
          console.log(class_id);
          connection.query('INSERT INTO student_data (rollno, class_id) VALUES (?, ?)', [extra_roll_number, class_id], (error, results, fields) => {
          if (error) {
            console.error('Error inserting new student into the database:', error);
            res.status(500).json({ error: 'Database query error' });
          } else {
            res.json('New record created successfully');
          }

           connection.end();
          });
    
  });


app.post('/new_test', (req, res) => {
  const test_name = req.body.test_name;
  const subject_name = req.body.subject_name;
  const test_date = req.body.test_date;
  const total_questions = req.body.total_questions;
  const selectedStatus = req.body.test_status; // Assumes selectedStatus contains the status_id
  console.log(selectedStatus);
  const selectedClass = req.body.test_class; // Assumes selectedClass contains the class_id
  console.log(selectedClass);

  const teacher_id = req.session.teacher_id;
  console.log(teacher_id);
  // Function to generate a random string
  function generateRandomString(length = 8) {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
  }
  
 //Example: Insert test data into the database
    connection.query(
    'INSERT INTO tests (teacher_id,name, subject, date, status_id, total_questions, class_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [teacher_id,test_name, subject_name, test_date, selectedStatus, total_questions, selectedClass],
    (err, testResult) => {
      if (err) {
        console.error('Error creating a new test: ' + err);
        return res.status(500).send('Error creating a new test');
      }

      const test_id = testResult.insertId;

      // Fetching student data based on class
      connection.query(
        'SELECT id FROM student_data WHERE class_id = ?',
        [selectedClass],
        (err, studentData) => {
          if (err) {
            console.error('Error fetching student data: ' + err);
            return res.status(500).send('Error creating a new test');
          }

          const temp = 8 - test_id.toString().length;

          // Iterate through student data and create student entries
          studentData.forEach((row1) => {
            const rollno = row1.id;
            const random = generateRandomString(temp) + test_id;

            // Create student entry
            connection.query(
              'INSERT INTO students (test_id, rollno, password, score, status) VALUES (?, ?, ?, ?, ?)',
              [test_id, rollno, random, 0, 0],
              (err, studentResult) => {
                if (err) {
                  console.error('Error creating student entry: ' + err);
                  return res.status(500).send('Error creating a new test');
                }
              }
            );
          });

          // Redirect to the dashboard upon success
          res.status(200).send('Test added successfully');
        }
      );
    }
  );
});

app.post('/completed/:testId', (req, res) => {
  const testId = req.params.testId;
  console.log(testId);
  // Define an SQL query to update the test status in the database
  const updateQuery = 'UPDATE tests SET status_id = 3 WHERE id = ?';

  connection.query(updateQuery, [testId], (err, results) => {
    if (err) {
      console.error('Error marking the test as completed:', err);
      res.status(500).json({ message: 'Error marking the test as completed' });
    } else {
      res.json({ message: 'Test marked as completed successfully' });
    }
  });
});

// Define the route for deleting a test
app.post('/delete/:testId', (req, res) => {
  const testId = req.params.testId;
   console.log(testId);
  // Define an SQL query to delete the test and its associated data
  const deleteQuery = 'DELETE FROM tests WHERE id = ?'; // Update table and conditions as per your schema

  connection.query(deleteQuery, [testId], (err, results) => {
    if (err) {
      console.error('Error deleting the test:', err);
      res.status(500).json({ message: 'Error deleting the test' });
    } else {
      res.json({ message: 'Test deleted successfully' });
    }
  });
});





app.post('/random-questions', (req, res) => {
  const numberOfQuestions = parseInt(req.body.numberOfQuestions, 10); // Parse the input as an integer

  if (isNaN(numberOfQuestions) || numberOfQuestions <= 0) {
    res.status(400).send('Invalid number of questions.');
    return;
  }

  // const query = 'SELECT * FROM questions ORDER BY RAND() LIMIT ?';

  // connection.query(query, [numberOfQuestions], (err, results) => {
  //     if (err) {
  //         console.error('Error querying the database:', err);
  //         res.status(500).send('Internal server error');
  //     } else {
  //         res.render('random-questions', { questions: results });
  //     }
  // });

  const query = `
    SELECT q.*, o.text AS option_text
    FROM questions q
    JOIN options o ON q.question_id = o.question_id
    ORDER BY RAND()
    LIMIT ?
`;

  connection.query(query, [numberOfQuestions], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      res.status(500).send('Internal server error');
    } else {
      // Organize the data into questions with options
      const questions = [];
      results.forEach((row) => {
        const question = questions.find((q) => q.question_id === row.question_id);
        if (question) {
          question.options.push({ text: row.option_text });
        } else {
          questions.push({
            question_id: row.question_id,
            text: row.text,
            options: [{ text: row.option_text }],
          });
        }
      });

      res.render('random-questions', { questions });
    }
  });
});

app.listen(port, () => {
  console.log('Server is running on port: ' + port);
});