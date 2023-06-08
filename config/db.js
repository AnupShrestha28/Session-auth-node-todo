const {Pool} = require("pg");

const getConnection = () =>{
    const conn = new Pool({
        host: 'localhost',
        user: 'anuptest',
        password: 'anup',
        database: 'tasknode',
        port: '5432'
    })

    console.log("Database Connected")
    return conn;
}

module.exports = getConnection;