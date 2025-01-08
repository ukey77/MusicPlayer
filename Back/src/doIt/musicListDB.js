const musicListDB = (req, res) => {
    const mysql = require("mysql");
    const dbConfig = require("../config/dbConfig");
    const sqlCommand = require("../sqlTemplate/sqlCommand");
    const sqlHandler = mysql.createConnection(dbConfig);
    sqlHandler.connect((err) => {
        if (err) throw err;
        sqlHandler.query(sqlCommand["viewAllData"], (err, resultData) => {
            if (err) throw err;
            res.json(resultData);
            // console.log("resultData", resultData);

            // == End connection ==
            sqlHandler.end();
        });
    })

}

module.exports = musicListDB;