// database services, accessible by DbService methods.

const mysql = require('mysql');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
dotenv.config(); // read from .env file

let instance = null; 


// if you use .env to configure
console.log("HOST: " + process.env.HOST);
console.log("DB USER: " + process.env.DB_USER);
console.log("PASSWORD: " + process.env.PASSWORD);
console.log("DATABASE: " + process.env.DATABASE);
console.log("DB PORT: " + process.env.DB_PORT);

const connection = mysql.createConnection({
     host: process.env.HOST,
     user: process.env.DB_USER,        
     password: process.env.PASSWORD,
     database: process.env.DATABASE,
     port: process.env.DB_PORT
});

// if you configure directly in this file, there is a security issue, but it will work
/*
const connection = mysql.createConnection({
     host:"localhost",
     user:"root",        
     password:"",
     database:"web_app",
     port:3306
});
*/

connection.connect((err) => {
     if(err){
        console.log(err.message);
     }
     console.log('db ' + connection.state);    // to see if the DB is connected or not
});

// the following are database functions, 

class DbService {
    static getDbServiceInstance(){ // only one instance is sufficient
        if (!instance) {
            instance = new DbService();
        }
        return instance;
    }

    /*
     This code defines an asynchronous function getAllData using the async/await syntax. 
     The purpose of this function is to retrieve all data from a database table named 
     "names" using a SQL query.

     Let's break down the code step by step:
         - async getAllData() {: This line declares an asynchronous function named getAllData.

         - try {: The try block is used to wrap the code that might throw an exception 
            If any errors occur within the try block, they can be caught and handled in 
            the catch block.

         - const response = await new Promise((resolve, reject) => { ... });: 
            This line uses the await keyword to pause the execution of the function 
            until the Promise is resolved. Inside the await, there is a new Promise 
            being created that represents the asynchronous operation of querying the 
            database. resolve is called when the database query is successful, 
            and it passes the query results. reject is called if there is an error 
            during the query, and it passes an Error object with an error message.

         - The connection.query method is used to execute the SQL query on the database.

         - return response;: If the database query is successful, the function returns 
           the response, which contains the results of the query.

        - catch (error) {: The catch block is executed if an error occurs anywhere in 
           the try block. It logs the error to the console.

        - console.log(error);: This line logs the error to the console.   
    }: Closes the catch block.

    In summary, this function performs an asynchronous database query using await and a 
   Promise to fetch all data from the "names" table. If the query is successful, 
   it returns the results; otherwise, it catches and logs any errors that occur 
   during the process. It's important to note that the await keyword is used here 
   to work with the asynchronous nature of the connection.query method, allowing 
   the function to pause until the query is completed.
   */
    async registerUser(username, password, firstname, lastname, salary, age) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const registerday = new Date();

            const insertResult = await new Promise((resolve, reject) => {
                const query = `
                    INSERT INTO Users (username, password, firstname, lastname, salary, age, registerday)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                connection.query(
                    query,
                    [username, hashedPassword, firstname, lastname, salary, age, registerday],
                    (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    }
                );
            });

            const user = await new Promise((resolve, reject) => {
                const query = "SELECT userid AS id, username, firstname, lastname, salary, age, registerday FROM Users WHERE username = ?";
                connection.query(query, [username], (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });

            return user;

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async verifyUser(username, password) {
        try {
            const user = await new Promise((resolve, reject) => {
                const query = "SELECT * FROM Users WHERE username = ?";
                connection.query(query, [username], (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });

            if (!user) return null;

            const match = await bcrypt.compare(password, user.password);
            if (!match) return null;

            const now = new Date();
            await new Promise((resolve, reject) => {
                const query = "UPDATE Users SET signintime = ? WHERE username = ?";
                connection.query(query, [now, username], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            return { 
                id: user.userid,       // changed to id to match frontend
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                salary: user.salary,
                age: user.age
            };

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getAllData() {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT * FROM names;";
                connection.query(query, (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results);
                });
            });
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async insertNewName(name) {
        try {
            const dateAdded = new Date();
            const insertId = await new Promise((resolve, reject) => {
                const query = "INSERT INTO names (name, date_added) VALUES (?, ?);";
                connection.query(query, [name, dateAdded], (err, result) => {
                    if (err) reject(new Error(err.message));
                    else resolve(result.insertId);
                });
            });
            console.log(insertId);
            return {
                id: insertId,
                name: name,
                dateAdded: dateAdded
            };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async searchByName(name) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT * FROM names WHERE name = ?;";
                connection.query(query, [name], (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results);
                });
            });
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async deleteRowById(id) {
        try {
            id = parseInt(id, 10);
            const response = await new Promise((resolve, reject) => {
                const query = "DELETE FROM names WHERE id = ?;";
                connection.query(query, [id], (err, result) => {
                    if (err) reject(new Error(err.message));
                    else resolve(result.affectedRows);
                });
            });
            console.log(response);
            return response === 1 ? true : false;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async updateNameById(id, newName) {
        try {
            console.log("dbService: ");
            console.log(id);
            console.log(newName);
            id = parseInt(id, 10);
            const response = await new Promise((resolve, reject) => {
                const query = "UPDATE names SET name = ? WHERE id = ?;";
                connection.query(query, [newName, id], (err, result) => {
                    if (err) reject(new Error(err.message));
                    else resolve(result.affectedRows);
                });
            });
            return response === 1 ? true : false;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async searchUsersByName(firstname, lastname) {
        try {
            const queryParts = [];
            const params = [];

            if (firstname) {
                queryParts.push("firstname LIKE ?");
                params.push(`%${firstname}%`);
            }
            if (lastname) {
                queryParts.push("lastname LIKE ?");
                params.push(`%${lastname}%`);
            }

            let query = "SELECT userid, username, firstname, lastname, salary, age, registerday, signintime FROM Users";
            if (queryParts.length > 0) {
                query += " WHERE " + queryParts.join(" AND ");
            }

            const response = await new Promise((resolve, reject) => {
                connection.query(query, params, (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results);
                });
            });

            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async searchUserByUsername(username) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT userid AS id, username, firstname, lastname, salary, age, registerday, signintime FROM Users WHERE username = ?;";
                connection.query(query, [username], (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results[0]);
                });
            });
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async searchUsersBySalaryRange(min, max) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT username, firstname, lastname, salary, age, registerday FROM Users WHERE salary BETWEEN ? AND ?;";
                connection.query(query, [min, max], (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results);
                });
            });

            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async searchUsersByAgeRange(min, max) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT username, firstname, lastname, salary, age, registerday FROM Users WHERE age BETWEEN ? AND ?;";
                connection.query(query, [min, max], (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results);
                });
            });

            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async searchUsersAfterJohn(username) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT userid AS id, username, firstname, lastname, salary, age, registerday, signintime FROM Users WHERE registerday > (SELECT registerday FROM Users WHERE username = ?);";
                connection.query(query, [username], (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results);
                });
            });
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async searchUsersWhoNeverRegistered() {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT username, firstname, lastname, salary, age, registerday FROM Users WHERE registerday IS NULL;";
                connection.query(query, (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results);
                });
            });

            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async searchUsersRegisteredSameDayAsJohn(username) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT userid AS id, username, firstname, lastname, salary, age, registerday, signintime FROM Users WHERE registerday = (SELECT registerday FROM Users WHERE username = ?);";
                connection.query(query, [username], (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results);
                });
            });
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async returnUsersRegisteredToday(registerday) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SELECT userid AS id, username, firstname, lastname, salary, age, registerday, signintime FROM Users WHERE registerday = ?;";
                connection.query(query, [registerday], (err, results) => {
                    if (err) reject(new Error(err.message));
                    else resolve(results);
                });
            });
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
  }

module.exports = DbService;