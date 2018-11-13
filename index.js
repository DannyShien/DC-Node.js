require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.static('public'));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// const Todo = require('./models/Todo');
const User = require('./models/User');
// const bcrypt = require('bcrypt');

const page = require('./views/page');
const userList = require('./views/userList');
const todoList = require('./views/todoList'); 
const userForm = require('./views/userForm');
const registrationForm = require('./views/registrationForm');
const loginForm = require('./views/loginForm');

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const db = require('./models/db');
app.use(session({
    store: new pgSession({
        pgPromise: db
    }),
    secret: 'abc123',
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    const thePage = page('Hey there');
    res.send(thePage);
});

function protectRoute(req, res, next) {
    let isLoggedIn = rq.session.user ? true : false;
    if (isLoggedIn) {
        next ();
    } else {
        res.redirect('/login');
    }
}

app.use((req, res, next) => {
    // let isLoggedIn = fasle; 
    // if (req.session.user) {
    //     isLoggedIn = true; 
    // }
    let isLoggedIn = re.session.user ? true : false;
    console.log(`Is a user logged in? ${isLoggednIn}`);
    // We call the nuext funciton!
    next()
    // No need to pass it anything, expless will handle that.
});


// === === ALL USERS === ===
// Retrieve all users
app.get('/users', (req, res) => {
    User.getAll()
        .then(allUsers => {
            // res.status(200).json(allUsers);
            // res.send(allUsers);
            const usersUL = userList(allUsers);
            const thePage = page(usersUL);
            console.log(thePage);
            res.send(thePage);

            // res.send(page(userList(allUsers)));
        });
});

// Listen for POST requests
// Create a new user
app.post('/users', (req, res) => {
    console.log(req);
    // console.log(req.body);
    // res.send('ok');
    const newUsername = req.body.name;
    console.log(newUsername);
    User.add(newUsername)
        .then(theUser => {
            res.send(theUser);
        })
});


// === === USER REGISTRATION === ===

app.get('/register', (req, res) => {
    // Send them the signup form
    const theForm = registrationForm();
    const thePage = page(theForm);
    res.send(thePage);
    // res.send(page(registrationForm()));
});
app.post('/register', (req, res) => {
    // Process the signup form
    // 1. Grab the values out of req.body
    const newName = req.body.name;
    const newUsername = req.body.username;
    const newPassword = req.body.password;

    console.log(newName);
    console.log(newUsername);
    console.log(newPassword);
    // 2. Call User.add
    User.add(newName, newUsername, newPassword)
        .catch(() => {
            res.redirect('/register');
        })
        .then(newUser => {
            // 3. If that works, redirect to the welcome page
            req.sessions.user = newUser;
            res.redirect('/welcome');
        });
});
app.get('/welcome', protectRoute, (req, res) => {
    // Send them the welcome page
    console.log(req.session.users);
    let visitorName = "Person of the world";
    if (registrationForm.session.user) {
        visitorName = req.session.user.username; 
    }
    res.send(page(`<h1>Hey ${visitorName}</h1>`,
    req.session.user));
});

// === === USER LOGIN === ===

app.get('/login', (req, res) => {
    // Send them the login form
    const theForm = loginForm();
    const thePage = page(theForm);
    res.send(thePage);
});
app.post('/login', (req, res) => {
    // Process the login form
    // 1. Grab values from form
    const theUsername = req.body.username;
    const thePassword = req.body.password;

    // 2. Find a user whose name
    // matches `theUsername`
    User.getByUsername(theUsername)
        .catch(err => {
            console.log(err);
            res.redirect('/login');
        })
        .then(theUser => {
            // const didMatch = bcrypt.compareSync(thePassword, theUser.pwhash);
            if (theUser.passwordDoesMatch(thePassword)) {
                req.session.user = theUser;
                res.redirect('/welcome');
            } else {
                res.redirect('/login');
            }
        })
    // 3. If I find a user 
    // then, check to see if
    // the password matches

    // 4. 

});

app.post('/lougout', (req, res) => {
    // 1. destroy the session 
    req.session.destroy();

    // 2. redirect them to the home page
    res.redirection('/');
});

// ========================================================
// Retrieve one user's info
app.get('/users/:id([0-9]+)', (req, res) => {
    // console.log(req.params.id);
    User.getById(req.params.id)
        .catch(err => {
            res.send({
                message: `no soup for you`
            });
        })
        .then(theUser => {
            res.send(theUser);
        })
});

// ========================================================
// Retrieve all todos for a user
app.get(`/users/:id(\\d+)/todos`, (req, res) => {
    User.getById(req.params.id)
        .then(theUser => {
            theUser.getTodos()
                .then(allTodos => {
                    const todosUL = todoList(allTodos);
                    const thePage = page(todosUL);
                    res.send(thePage);
                })
        })
});


// ========================================================
// GET the form for editing one user's info
app.get('/users/:id([0-9]+)/edit', (req, res) => {
    // console.log(req.params.id);
    User.getById(req.params.id)
        .catch(err => {
            res.send({
                message: `no soup for you`
            });
        })
        .then(theUser => {
            res.send(page(userForm(theUser)));
        })
});

// ========================================================
// Process the form for editing one user's info
app.post('/users/:id([0-9]+)/edit', (req, res) => {
    const id = req.params.id;
    const newName = req.body.name;
    // Get the user by their id
    User.getById(id)
        .then(theUser => {
            // call that user's updateName method
            theUser.updateName(newName)
                .then(didUpdate => {
                    if (didUpdate) {
                        // res.send('yeah you did');
                        // res.redirect(`/users/${id}/edit`);
                        res.redirect(`/users/`);
                    } else {
                        res.send('💩');
                    }
                });            
        });
});


// ========================================================


// Updating an existing user
// Using POST because HTML Forms can only send GET or POST. 
// HTML Forms cannot send a Put (or a DELETE). 
// app.post('/users/:id(\\d+)', (req, res) => {
// app.post('/users/:id([0-9]+)', (req, res) => {
//     const id = req.params.id; 
//     const newName = req.body.name; 
//     // Get the user by their ID
//     User.getById(id)
//         .then(theUser => {
//             // call that user's updateName method
//             theUser.updateName(newName)
//                 .then(didUpdate => {
//                     if (didUpdate) {
//                         res.send('Updated');
//                     } else {
//                         res.send('What update');
//                     }
//                 });
//         });
// });

// Example of grabbing a user by an imaginary 'getByName' method. 
// app.post('/users/name/:name([A-Z0-9]+)', (req, res) => {
//     const name = req.params.name;
//     const newName = req.body.name; 
//     console.log(id);
//     console.log(newName);
//     // res.send('ok');
//     // Get the user by their id
//     User.getByName(name)
//         .then(theUser => {
//             // call the user's updateName method
//             theUser.updateName(newName)
//                 .then(result => {
//                     if(result.rowCount === 1) {
//                         res.send('Updated');
//                     } else {
//                         res.send('No update');
//                     }
//                 });
//         });
// });

// Match the string "/users/" folloed by one or more digits
// REGular EXpression
// // app.get('/user/:id(\\d+)', (req, res) => {
// app.get('/users/:id([0-9]+)/edit', (req, res) => {
//     // console.log(req.params.id);
//     User.getById(req.params.id)
//         .catch(err => {
//             res.send({
//                 message: `No user found by that ID`
//             });
//         })
//         .then(theUser => {
//             res.send(page(userForm(theUser)));
//         })
// });

// app.get('/user/:id[0-9]+)/rename/:newName', (req, res) => {
//     // console.log(req.params.id); 
//     User.getById(req.params.id)
//         .catch(err => {
//             res.send({
//                 message: `Not updated`
//             });
//         })
//         .then(theUser => {
//             res.send(theUser);
//         })
// });

// app.get(`/users/:id([0-9]+)/todos`, (req, res) => {
//     User.getById(req.params.id)
//         .then(theUser => {
//             theUser.getTodos()
//                 .then(allTodos => {
//                     const todoUL = todoList(allTodos);
//                     const thePage = page(todoUL);
//                     res.send(thePage);
//                 })
//         })
// });

// app.get('/users/register', (req, res) => {
//     res.send('you are on the registration page');
// });

// app.get('/users/:id[0-9]+)/rename/:newName', (req, res) => {
//     User.getById(req.params.id)
//         .then(user => {
//             user.updateName(req.params.newName)
//                 .then(() => {
//                     res.send('Renamed');
//                 })
//         })
// });

// app.get('/todos', (req, res) => {
//     Todo.getAll()
//         .then(allTodos => {
//                 res.send(allTodos);
//         })
// })

// app.get('/todos/:id(\\d+)', (req, res) => {
//     console.log(req.params.id);
//     Todo.getById(req.params.id)
//         .catch(err => {
//             res.send({
//                 message: `No todo found by that ID`
//             });
//         })
//         .then(theTodo => {    
//             res.send(theTodo);
//         })
// });

// === === === Example of sending a whole page === === ===

/*
    User.getAll()
        .then(allUsers => {
            let usersList = ``;
            allUsers.forEach(user => {
                usersList += `<li>${user.name}</li>`
            });
            let thePage = `
              <!doctype>
              <html>
                <head>
                </head>
                <body>
                    <h1>hey</h1>
                    <ul>
                        ${usersList}
                    </ul>
                </body>
              </html>
            `;
            res.send(thePage);
            // console.log(allUsers);
            // res.send(allUsers);
            // res.send(allUsers);
            // res.status(200).json(allUsers);
        })
    // res.send('Hellooooooo Expresssssssssssssuh');
*/

// connection
app.listen(3000, () => {
    console.log(`You're express app is ready!`)
});
// =================    ====================    ====================
    

// === === === USERS === === ===
// === === CREATE === ===

// User.add('jeff')
//     .then(result => {
//         console.log(result);
//     })

// User.add('jeff')
// User.add('jeff')
// User.add('jeff')
//     .then(theNewUser => {
//         theNewUser.getTodos()
//             .then(todos => {
//                 console.log(`${theNewUser.name} has ${todos.length} things todo`);
//             })
//     })

// === === RETRIEVE === ===
// User.getAll()
//     .then(result => { console.log(result); })

// User.getAll()
//     .then(results => {
//         console.log(results);
//         console.log(`yep those were the users. cool.`)
//     })

// User.getAll()
//     .then(allUsers => {
//         allUsers.forEach(user => {
//             console.log(user.name);
//         });
//     })

// User.getById('chris')
//     .then(result => { console.log(result); })

// User.getById(6)
//     .then(u => {
//         u.delete();
//     });


// User.getById(1)
//     .then(userFromDB => {
//         console.log(userFromDB);
//         userFromDB.getTodos()
//             .then(todos => {
//                 console.log(todos);
//             })
//     });

// User.searchByName('a')
//     .then(users => {
//         console.log(users);
//     });

// const beth = new User(2, 'beth');
// beth.getTodos()
//     .then(result => { console.log(result); })

//User.getTodosForUser(3)
//     .then(result => { console.log(result); })

// === === UPDATE === === 
// User.updateName(1, 'aylin')
//     .then(result => {
//         console.log(result);
//     })

// User.updateName(6, 'JEEEEEEEEEEEEEEEf')
//     .then(result => {
//         console.log(result);
//     })

// === === DELETE === ===
// User.deleteById('asdfasdfasf')
//     .then(result => { console.log(result); })

// User.deleteById(6)
//     .then(result => {
//         console.log(result.rowCount);
//     })

// User.deleteById(8);


// === === === TODOS === === ===
// === === CREATE === ===
// Todo.add('walk the chewbacca', false)
//     .catch(err => {
//         console.log(err);
//     })
//     .then(result => {
//         console.log(result);
//     })

// Todo.add('find foooood', false)
//     .catch(err => {
//         console.log(err);
//     })
//     .then(result => {
//         console.log(result);
//         // console.log('Task was added to table');
//     })

// === === RETRIEVE === ===
// Todo.getById(20)
//     .then(result => { console.log(result); })

// Todo.getAll() 
//     .then(allTask => {
//         console.log(allTask);
//     })

// === === UPDATE ===  ===
// Todo.updateName(17, 'take a nap') 
//     .then(result => {
//         console.log(result);
//     })

// Todo.assignToUser(2, 2)
//     .then(() => {
//         User.getTodosForUser(2)
//         .then(result => { console.log(result); }) 
//     })      

// Todo.assignToUser(5, 2)
//     .then(() => {
//         User.getTodosForUser(2)
//         .then(result => { console.log(result); })
//     })       
// Todo.assignToUser(3, 2)
//     .then(() => {
//         User.getTodosForUser(2)
//         .then(result => { console.log(result); })    
//     })           
// Todo.assignToUser(4, 5)
//     .then(() => {
//         User.getTodosForUser(2)
//         .then(result => { console.log(result); })
//     })    
// Todo.assignToUser(1, 5)
//     .then(() => {
//         User.getTodosForUser(2)
//         .then(result => { console.log(result); })    
//     })

// Todo.markCompleted(1)
//     .then(result => {
//         console.log(result);
//     })

// === === DELETE === ===
// Todo.deleteById(10)
//     .then(result => { console.log(result); })

// Todo.deleteById(10)
//     .then(result => {
//         console.log(result.rowCound);
//     })
// === === === === === === === === === ===

// let newUsers = [
//     'jeff',
//     'brandy',
//     'zack',
//     'tasha',
//     'jenn',
//     'cori'
// ];

// newUsers.forEach(u => {
//     User.add(u)
//         .then(aNewUser => {
//             aNewUser.addTodo('do the thing');
//         })
// });


// const skyler = new User('Skyler the Dog');
// const ahjuma = new User('Ahjuma the Impressive');

// // debugger;

// skyler.greet(ahjuma);
// ahjuma.greet(skyler);

// let u = User.findById(1);
// u.name = 'eileeeeeeen';
// u.save();












app.use(express.static('public'));

// Configure body-parser to read data sent by HTML form tags
app.use(bodyParser.urlencoded({ extended: false }));

// Configure body-parser to read JSON bodies
app.use(bodyParser.json());

// const Todo = require('./models/Todo');
const User = require('./models/User');
// const bcrypt = require('bcrypt');

const page = require('./views/page');
const userList = require('./views/userList');
const todoList = require('./views/todoList');
const userForm = require('./views/userForm');
const registrationForm = require('./views/registrationForm');
const loginForm = require('./views/loginForm');


app.get('/', (req, res) => {
    const thePage = page('hey there');
    res.send(thePage);
});

// ========================================================
// ALL USERS
// ========================================================
// Retrieve all users
app.get('/users', (req, res) => {
    User.getAll()
        .then(allUsers => {
            // res.status(200).json(allUsers);
            // res.send(allUsers);
            const usersUL = userList(allUsers);
            const thePage = page(usersUL);
            console.log(thePage);
            res.send(thePage);

            // res.send(page(userList(allUsers)));
        });
});

// Listen for POST requests
// Create a new user
app.post('/users', (req, res) => {
    console.log(req);
    // console.log(req.body);
    // res.send('ok');
    const newUsername = req.body.name;
    console.log(newUsername);
    User.add(newUsername)
        .then(theUser => {
            res.send(theUser);
        })
});


// ========================================================
// User Registration
// ========================================================

app.get('/register', (req, res) => {
    // Send them the signup form
    const theForm = registrationForm();
    const thePage = page(theForm);
    res.send(thePage);
    // res.send(page(registrationForm()));
});
app.post('/register', (req, res) => {
    // Process the signup form
    // 1. Grab the values out of req.body
    const newName = req.body.name;
    const newUsername = req.body.username;
    const newPassword = req.body.password;

    console.log(newName);
    console.log(newUsername);
    console.log(newPassword);
    // 2. Call User.add
    User.add(newName, newUsername, newPassword)
        .then(newUser => {
            // 3. If that works, redirect to the welcome page
            res.redirect('/welcome');
        });
});
app.get('/welcome', (req, res) => {
    // Send them the welcome page
    console.log(req.session.user);
    res.send(page(`<h1>Hey ${req.session.user.username}</h1>`));
})

// ========================================================
// User Login
// ========================================================
app.get('/login', (req, res) => {
    // Send them the login form
    const theForm = loginForm();
    const thePage = page(theForm);
    res.send(thePage);
});
app.post('/login', (req, res) => {
    // Process the login form
    // 1. Grab values from form
    const theUsername = req.body.username;
    const thePassword = req.body.password;

    // 2. Find a user whose name
    // matches `theUsername`
    User.getByUsername(theUsername)
        .catch(err => {
            console.log(err);
            res.redirect('/login');
        })
        .then(theUser => {
            // const didMatch = bcrypt.compareSync(thePassword, theUser.pwhash);
            if (theUser.passwordDoesMatch(thePassword)) {
                req.session.user = theUser;
                res.redirect('/welcome');
            } else {
                res.redirect('/login');
            }
        })
    // 3. If I find a. user
    // then, check to see if
    // the password matches

    // 4. 

});

// ========================================================
// Retrieve one user's info
app.get('/users/:id([0-9]+)', (req, res) => {
    // console.log(req.params.id);
    User.getById(req.params.id)
        .catch(err => {
            res.send({
                message: `no soup for you`
            });
        })
        .then(theUser => {
            res.send(theUser);
        })
});

// ========================================================
// Retrieve all todos for a user
app.get(`/users/:id(\\d+)/todos`, (req, res) => {
    User.getById(req.params.id)
        .then(theUser => {
            theUser.getTodos()
                .then(allTodos => {
                    const todosUL = todoList(allTodos);
                    const thePage = page(todosUL);
                    res.send(thePage);
                })
        })
});


// ========================================================
// GET the form for editing one user's info
app.get('/users/:id([0-9]+)/edit', (req, res) => {
    // console.log(req.params.id);
    User.getById(req.params.id)
        .catch(err => {
            res.send({
                message: `no soup for you`
            });
        })
        .then(theUser => {
            res.send(page(userForm(theUser)));
        })
});

// ========================================================
// Process the form for editing one user's info
app.post('/users/:id([0-9]+)/edit', (req, res) => {
    const id = req.params.id;
    const newName = req.body.name;
    // Get the user by their id
    User.getById(id)
        .then(theUser => {
            // call that user's updateName method
            theUser.updateName(newName)
                .then(didUpdate => {
                    if (didUpdate) {
                        // res.send('yeah you did');
                        // res.redirect(`/users/${id}/edit`);
                        res.redirect(`/users/`);
                    } else {
                        res.send('💩');
                    }
                });            
        });
});


// ========================================================

app.listen(3000, () => {
    console.log('You express app is ready!');
});
