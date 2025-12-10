// Backend: application services, accessible by URIs

const express = require('express')
const cors = require ('cors')
const dotenv = require('dotenv')
dotenv.config()

const app = express();
const dbService = require('./dbService');

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: false}));

// create
app.post('/insert', (request, response) => {
    const {name} = request.body;
    const db = dbService.getDbServiceInstance();

    db.insertNewName(name)
      .then(data => response.json({data: data}))
      .catch(err => console.log(err));
});

// register
app.post('/register', (req, res) => {
  const { username, password, firstname, lastname, salary, age } = req.body;
  const db = dbService.getDbServiceInstance();

  db.registerUser(username, password, firstname, lastname, salary, age)
    .then(data => res.json({ success: true, data }))
    .catch(err => {
      console.log(err);
      res.status(500).json({ success: false });
    });
});

// login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = dbService.getDbServiceInstance();

  db.verifyUser(username, password)
    .then(user => {
      if (user) res.json({ success: true, user });
      else res.json({ success: false, message: "Invalid credentials" });
    })
    .catch(err => res.status(500).json({ success: false }));
});

// read all
app.get('/getAll', (request, response) => {
    const db = dbService.getDbServiceInstance();
    db.getAllData()
      .then(data => response.json({data: data}))
      .catch(err => console.log(err));
});

// search names
app.get('/search/:name', (request, response) => { 
    const {name} = request.params;
    const db = dbService.getDbServiceInstance();

    let result;
    if(name === "all") result = db.getAllData();
    else result = db.searchByName(name);

    result
      .then(data => response.json({data: data}))
      .catch(err => console.log(err));
});

// update
app.patch('/update', (request, response) => {
    const {id, name} = request.body;
    const db = dbService.getDbServiceInstance();

    db.updateNameById(id, name)
      .then(() => response.json({success: true}))
      .catch(err => console.log(err)); 
});

// delete
app.delete('/delete/:id', (request, response) => {     
    const {id} = request.params;
    const db = dbService.getDbServiceInstance();

    db.deleteRowById(id)
      .then(() => response.json({success: true}))
      .catch(err => console.log(err));
});   

// search users by first/last name
app.get('/user/search', (req, res) => {
  const { first, last } = req.query;
  const db = dbService.getDbServiceInstance();
  db.searchUsersByName(first, last)
    .then(data => res.json({ data }))
    .catch(err => console.log(err));
});

// search user by username
app.get('/user/by-username/:username', (req, res) => {
  const { username } = req.params;
  const db = dbService.getDbServiceInstance();
  db.searchUserByUsername(username)
    .then(data => res.json({ data }))
    .catch(err => console.log(err));
});

// search users by salary range
app.get('/user/salary', (req, res) => {
  const { min, max } = req.query;
  const db = dbService.getDbServiceInstance();
  db.searchUsersBySalaryRange(min, max)
    .then(data => res.json({ data }))
    .catch(err => console.log(err));
});

// search users by age range
app.get('/user/age-range', (req, res) => {
  const { min, max } = req.query;
  const db = dbService.getDbServiceInstance();
  db.searchUsersByAgeRange(min, max)
    .then(data => res.json({ data }))
    .catch(err => console.log(err));
});

// search users registered after a specific user
app.get('/user/after/:username', (req, res) => {
  const { username } = req.params;
  const db = dbService.getDbServiceInstance();
  db.searchUsersAfterJohn(username)
    .then(data => res.json({ data }))
    .catch(err => console.log(err));
});

// search users who never registered
app.get('/user/unregistered', (req, res) => {
  const db = dbService.getDbServiceInstance();
  db.searchUsersWhoNeverRegistered()
    .then(data => res.json({ data }))
    .catch(err => console.log(err));
});

// search users who registered same day as a specific user
app.get('/user/same-day/:username', (req, res) => {
  const { username } = req.params;
  const db = dbService.getDbServiceInstance();
  db.searchUsersRegisteredSameDayAsJohn(username)
    .then(data => res.json({ data }))
    .catch(err => console.log(err));
});

// return users who registered today
app.get('/user/registered-today', (req, res) => {
  const db = dbService.getDbServiceInstance();
  const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD
  db.returnUsersRegisteredToday(today)
    .then(data => res.json({ data }))
    .catch(err => console.log(err));
});

// debug
app.post('/debug', (request, response) => {
    const {debug} = request.body;
    console.log(debug);
    return response.json({success: true});
});

// test DB
app.get('/testdb', (request, response) => {
    const db = dbService.getDbServiceInstance();
    db.deleteRowById("14")
      .then(data => response.json({data: data}))
      .catch(err => console.log(err));
});

// start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`I am listening on port ${PORT}.`)
});