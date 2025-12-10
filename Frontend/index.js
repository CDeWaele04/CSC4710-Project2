
// This is the frontEnd that modifies the HTML page directly
// event-based programming,such as document load, click a button

/*
What is a Promise in Javascript? 

A Promise can be in one of three states:

    - Pending: The initial state; the promise is neither fulfilled nor rejected.

    - Fulfilled: The operation completed successfully, and the promise has a 
      resulting value.

    - Rejected: The operation failed, and the promise has a reason for the failure.

Promises have two main methods: then and catch.

    - The then method is used to handle the successful fulfillment of a promise. 
    It takes a callback function that will be called when the promise is resolved, 
    and it receives the resulting value.

    - The catch method is used to handle the rejection of a promise. It takes a 
    callback function that will be called when the promise is rejected, and it 
    receives the reason for the rejection.

What is a promise chain? 
    The Promise chain starts with some asyncOperation1(), which returns a promise, 
    and each subsequent ``then`` is used to handle the result of the previous Promise.

    The catch is used at the end to catch any errors that might occur at any point 
    in the chain.

    Each then returns a new Promise, allowing you to chain additional ``then`` calls to 
    handle subsequent results.

What is an arrow function?

    An arrow function in JavaScript is a concise way to write anonymous function 
    expressions.

    Traditional function syntax: 
        const add = function(x, y) {
           return x + y;
        };

    Arrow function syntax:
        const add = (x, y) => x + y;
    
    
Arrow functions have a few notable features:

    - Shorter Syntax: Arrow functions eliminate the need for the function keyword, 
      curly braces {}, and the return keyword in certain cases, making the syntax 
      more concise.

    - Implicit Return: If the arrow function consists of a single expression, it is 
      implicitly returned without needing the return keyword.

    - Lexical this: Arrow functions do not have their own this context; instead, they 
      inherit this from the surrounding code. This can be beneficial in certain situations,
      especially when dealing with callbacks and event handlers.
*/


// fetch call is to call the backend
document.addEventListener('DOMContentLoaded', function() {
    // one can point your browser to http://localhost:5050/getAll to check what it returns first.
    fetch('http://localhost:5050/getAll')     
    .then(response => response.json())
    .then(data => loadHTMLTable(data['data']));
});


// when the addBtn is clicked
const addBtn = document.querySelector('#add-name-btn');
addBtn.onclick = function (){
    const nameInput = document.querySelector('#name-input');
    const name = nameInput.value;
    nameInput.value = "";

    fetch('http://localhost:5050/insert', {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({name: name})
    })
    .then(response => response.json())
    .then(data => insertRowIntoTable(data['data']));
}

// when the searchBtn is clicked
const searchBtn =  document.querySelector('#search-btn');
searchBtn.onclick = function (){
    const searchInput = document.querySelector('#search-input');
    const searchValue = searchInput.value;
    searchInput.value = "";

    fetch('http://localhost:5050/search/' + searchValue)
    .then(response => response.json())
    .then(data => loadHTMLTable(data['data']));
}

let rowToDelete; 

// when the delete button is clicked, since it is not part of the DOM tree, we need to do it differently
document.querySelector('table tbody').addEventListener('click', 
      function(event){
        if(event.target.className === "delete-row-btn"){

            deleteRowById(event.target.dataset.id);   
            rowToDelete = event.target.parentNode.parentNode.rowIndex;    
            debug("delete which one:");
            debug(rowToDelete);
        }   
        if(event.target.className === "edit-row-btn"){
            showEditRowInterface(event.target.dataset.id); // display the edit row interface
        }
      }
);

function deleteRowById(id){
    // debug(id);
    fetch('http://localhost:5050/delete/' + id,
       { 
        method: 'DELETE'
       }
    )
    .then(response => response.json())
    .then(
         data => {
             if(data.success){
                document.getElementById("table").deleteRow(rowToDelete);
                // location.reload();
             }
         }
    );
}

let idToUpdate = 0;

function showEditRowInterface(id){
    debug("id clicked: ");
    debug(id);
    document.querySelector('#update-name-input').value = ""; // clear this field
    const updateSetction = document.querySelector("#update-row");  
    updateSetction.hidden = false;
    // we assign the id to the update button as its id attribute value
    idToUpdate = id;
    debug("id set!");
    debug(idToUpdate+"");
}


// when the update button on the update interface is clicked
const updateBtn = document.querySelector('#update-row-btn');

updateBtn.onclick = function(){
    debug("update clicked");
    debug("got the id: ");
    debug(updateBtn.value);
    
    const updatedNameInput = document.querySelector('#update-name-input');

    fetch('http://localhost:5050/update',
          {
            headers: {
                'Content-type': 'application/json'
            },
            method: 'PATCH',
            body: JSON.stringify(
                  {
                    id: idToUpdate,
                    name: updatedNameInput.value
                  }
            )
          }
    ) 
    .then(response => response.json())
    .then(data => {
        if(data.success){
            location.reload();
        }
        else 
           debug("no update occurs");
    })
}


// this function is used for debugging only, and should be deleted afterwards
function debug(data)
{
    fetch('http://localhost:5050/debug', {
        headers: {
            'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({debug: data})
    })
}

function insertRowIntoTable(data){

   debug("index.js: insertRowIntoTable called: ");
   debug(data);

   const table = document.querySelector('table tbody');
   debug(table);

   const isTableData = table.querySelector('.no-data');

  // debug(isTableData);

   let tableHtml = "<tr>";
   
   for(var key in data){ // iterating over the each property key of an object data
      if(data.hasOwnProperty(key)){   // key is a direct property for data
            if(key === 'dateAdded'){  // the property is 'dataAdded'
                data[key] = new Date(data[key]).toLocaleString(); // format to javascript string
            }
            tableHtml += `<td>${data[key]}</td>`;
      }
   }

   tableHtml +=`<td><button class="delete-row-btn" data-id=${data.id}>Delete</td>`;
   tableHtml += `<td><button class="edit-row-btn" data-id=${data.id}>Edit</td>`;

   tableHtml += "</tr>";

    if(isTableData){
       debug("case 1");
       table.innerHTML = tableHtml;
    }
    else {
        debug("case 2");
        // debug(tableHtml);

        const newrow = table.insertRow();
        newrow.innerHTML = tableHtml;
    }
}

function loadHTMLTable(data){
    debug("index.js: loadHTMLTable called.");

    const table = document.querySelector('table tbody'); 
    
    if(data.length === 0){
        table.innerHTML = "<tr><td class='no-data' colspan='5'>No Data</td></tr>";
        return;
    }
  
    /*
    In the following JavaScript code, the forEach method is used to iterate over the 
    elements of the data array. The forEach method is a higher-order function 
    that takes a callback function as its argument. The callback function is 
    executed once for each element in the array.
    
    In this case, the callback function takes a single argument, which is an object 
    destructuring pattern:


    function ({id, name, date_added}) {
        // ... code inside the callback function
    }

    This pattern is used to extract the id, name, and date_added properties from each 
    element of the data array. The callback function is then executed for each element
    in the array, and within the function, you can access these properties directly 
    as variables (id, name, and date_added).

    
    In summary, the forEach method is a convenient way to iterate over each element in 
    an array and perform some operation or execute a function for each element. 
    The provided callback function is what gets executed for each element in the 
    data array.
    */

    let tableHtml = "";
    data.forEach(function ({id, name, date_added}){
         tableHtml += "<tr>";
         tableHtml +=`<td>${id}</td>`;
         tableHtml +=`<td>${name}</td>`;
         tableHtml +=`<td>${new Date(date_added).toLocaleString()}</td>`;
         tableHtml +=`<td><button class="delete-row-btn" data-id=${id}>Delete</td>`;
         tableHtml += `<td><button class="edit-row-btn" data-id=${id}>Edit</td>`;
         tableHtml += "</tr>";
    });

    table.innerHTML = tableHtml;
}

function loadUserTable(data){
    const table = document.querySelector('#user-table tbody');
    if(data.length === 0){ table.innerHTML = "<tr><td colspan='7'>No Data</td></tr>"; return; }
    let html = "";
    data.forEach(u => {
        html += `<tr>
                    <td>${u.id}</td>
                    <td>${u.username}</td>
                    <td>${u.firstname}</td>
                    <td>${u.lastname}</td>
                    <td>${u.salary}</td>
                    <td>${u.age}</td>
                    <td>${new Date(u.registerday).toLocaleString()}</td>
                 </tr>`;
    });
    table.innerHTML = html;
}

// Register new user
document.querySelector('#reg-btn').onclick = () => {
    const body = {
        username: document.querySelector('#reg-username').value,
        password: document.querySelector('#reg-password').value,
        firstname: document.querySelector('#reg-firstname').value,
        lastname: document.querySelector('#reg-lastname').value,
        salary: parseInt(document.querySelector('#reg-salary').value),
        age: parseInt(document.querySelector('#reg-age').value)
    };
    fetch('http://localhost:5050/register', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body)
    })
    .then(r=>r.json())
    .then(d=>{
        loadUserTable([d.data]);
        alert("User registered successfully");
    });
};

// Login
document.querySelector('#login-btn').onclick = () => {
    const body = {
        username: document.querySelector('#login-username').value,
        password: document.querySelector('#login-password').value
    };
    fetch('http://localhost:5050/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body)
    })
    .then(r=>r.json())
    .then(d=>{
        if(d.success){
            alert("Login successful: " + JSON.stringify(d.user));
        } else {
            alert("Login failed: " + d.message);
        }
    });
};

// Search by first and/or last name
document.querySelector('#search-name-btn').onclick = () => {
    const first = document.querySelector('#search-first').value;
    const last = document.querySelector('#search-last').value;
    fetch(`http://localhost:5050/user/search?first=${first}&last=${last}`)
    .then(r=>r.json())
    .then(d=>loadUserTable(d.data));
};

// Search by user ID
document.querySelector('#search-id-btn').onclick = () => {
    const id = document.querySelector('#search-userid').value;
    fetch(`http://localhost:5050/user/by-username/${id}`)
    .then(r=>r.json())
    .then(d=>loadUserTable([d.data]));
};

// Search by salary range
document.querySelector('#salary-btn').onclick = () => {
    const min = document.querySelector('#salary-min').value;
    const max = document.querySelector('#salary-max').value;
    fetch(`http://localhost:5050/user/salary?min=${min}&max=${max}`)
    .then(r=>r.json())
    .then(d=>loadUserTable(d.data));
};

// Search by age range
document.querySelector('#age-btn').onclick = () => {
    const min = document.querySelector('#age-min').value;
    const max = document.querySelector('#age-max').value;
    fetch(`http://localhost:5050/user/age-range?min=${min}&max=${max}`)
    .then(r=>r.json())
    .then(d=>loadUserTable(d.data));
};

// Registered after a specific user
document.querySelector('#after-user-btn').onclick = () => {
    const id = document.querySelector('#ref-user').value;
    fetch(`http://localhost:5050/user/after/${id}`)
    .then(r=>r.json())
    .then(d=>loadUserTable(d.data));
};

// Registered on same day as a specific user
document.querySelector('#same-day-btn').onclick = () => {
    const id = document.querySelector('#ref-user').value;
    fetch(`http://localhost:5050/user/same-day/${id}`)
    .then(r=>r.json())
    .then(d=>loadUserTable(d.data));
};

// Users who never signed in
document.querySelector('#never-signed-in-btn').onclick = () => {
    fetch('http://localhost:5050/user/unregistered')
    .then(r=>r.json())
    .then(d=>loadUserTable(d.data));
};

// Users who registered today
document.querySelector('#registered-today-btn').onclick = () => {
    fetch('http://localhost:5050/user/registered-today')
    .then(r=>r.json())
    .then(d=>loadUserTable(d.data));
};