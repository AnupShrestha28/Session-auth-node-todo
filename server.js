// require
const express = require("express");
const getConnection = require("./config/db");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const session = require("express-session");

// init
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.set("view engine", "ejs");
const conn = getConnection();

// middleware
app.use(
    session({
        name: "node auth task",
        resave: false,
        saveUninitialized: true,
        secret: "This is secret",
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// Middleware for authentication
const requireAuth = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect("/");
    }
};

app.use((req, res, next) => {
    req.conn = conn;
    next();
});

app.get("/", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const conn = req.conn;

    const query = "SELECT * FROM login WHERE username = $1 AND password = $2";
    const values = [username, password];
    conn.query(query, values, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send("An error occurred");
        } else {
            if (results.rows.length > 0) {
                req.session.isLoggedIn = true;
                req.session.username = username;
                res.redirect("/index");
            } else {
                res.render("login", { error: "Invalid username or password" });
            }
        }
    });
});

app.get("/index", requireAuth, (req, res) => {
    req.conn.query("SELECT * FROM todo", (error, result) => {
        if (error) {
            res.status(500).send("Error occurred");
        }
        res.render("index", { items: result.rows, editTodo: null });
    });
});

app.post("/add-todo", (req, res) => {
    const todo = req.body.todo;

    if (!todo || todo.trim() === "") {
        req.conn.query("SELECT * FROM todo", (error, result) => {
            if (error) {
                res.status(500).send("Error occurred");
            }
            res.render("index", {
                items: result.rows,
                editTodo: null,
                errorMessage: "Todo cannot be empty."
            });
        });
    } else {
        req.conn.query(
            "INSERT INTO todo (id, title) values($1, $2)",
            [Math.floor(Math.random() * 1000), todo],
            (error, result) => {
                if (error) {
                    res.status(500).send("Error occurred");
                }
                res.redirect("/index");
            }
        );
    }
});


app.post("/delete-todo/:id", (req, res) => {
    const todoId = req.params.id;
    req.conn.query("DELETE FROM todo WHERE id = $1", [todoId], (error, result) => {
        if (error) {
            res.status(200).send("Error Occurred");
        }
        res.redirect("/index");
    });
});

app.get("/edit-todo/:id", (req, res) => {
    const todoId = req.params.id;
    req.conn.query("SELECT * FROM todo WHERE id = $1", [todoId], (error, result) => {
        if (error) {
            res.status(500).send("Error occurred");
        }
        res.render("index", { items: result.rows, editTodo: result.rows[0] });
    });
});

app.post("/update-todo", (req, res) => {
    const todoId = req.body.todoId;
    const updateTitle = req.body.updateTodo;

    req.conn.query(
        "UPDATE todo SET title = $1 WHERE id = $2",
        [updateTitle, todoId],
        (error, result) => {
            if (error) {
                res.status(500).send("Error Occurred");
            }
            res.redirect("/index");
        }
    );
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    return res.redirect("/");
});

app.listen(8000, () => {
    console.log("Server listening to port 8000");
});
