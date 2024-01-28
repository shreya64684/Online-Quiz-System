// routes/classes.js

const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'quizz',
});

router.post('/get-classes', (req, res) => {
  connection.connect();

  connection.query('SELECT name FROM classes', (error, results, fields) => {
    if (error) {
      console.error('Error querying the database:', error);
      res.status(500).json({ error: 'Database query error' });
    } else {
      const classes = results.map((row) => row.name);
      res.json(classes);
    }

    connection.end();
  });
});

router.post('/add-new-class', (req, res) => {
    const { class_name, starting_roll_number, ending_roll_number } = req.body;
  
    connection.connect();
  
    connection.query('INSERT INTO classes (name) VALUES (?)', [class_name], (error, results, fields) => {
      if (error) {
        console.error('Error inserting new class into the database:', error);
        res.status(500).json({ error: 'Database query error' });
      } else {
        const class_id = results.insertId;
  
        const insertStudentData = 'INSERT INTO student_data (rollno, class_id) VALUES ?';
        const studentData = [];
  
        for (let i = starting_roll_number; i <= ending_roll_number; i++) {
          studentData.push([i, class_id]);
        }
  
        connection.query(insertStudentData, [studentData], (error, results, fields) => {
          if (error) {
            console.error('Error inserting student data into the database:', error);
            res.status(500).json({ error: 'Database query error' });
          } else {
            res.json('Success');
          }
  
          connection.end();
        });
      }
    });
});

router.post('/add-extra-student', (req, res) => {
    const { class_name, extra_roll_number } = req.body;
  
    connection.connect();
  
    connection.query('SELECT id FROM classes WHERE name = ?', [class_name], (error, results, fields) => {
      if (error) {
        console.error('Error querying the database:', error);
        res.status(500).json({ error: 'Database query error' });
      } else {
        if (results.length === 0) {
          res.status(404).json({ error: 'Class not found' });
          return;
        }
  
        const class_id = results[0].id;
  
        connection.query('INSERT INTO student_data (rollno, class_id) VALUES (?, ?)', [extra_roll_number, class_id], (error, results, fields) => {
          if (error) {
            console.error('Error inserting new student into the database:', error);
            res.status(500).json({ error: 'Database query error' });
          } else {
            res.json('New record created successfully');
          }
  
          connection.end();
        });
      }
    });
  });

module.exports = router;
