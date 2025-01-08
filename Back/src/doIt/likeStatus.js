const likeStatus = (req, res) => {
    // req.body
    const [id, isLiked] = [(req.body.id), (req.body.isLiked)];
    // sql
    const mysql = require("mysql");
    const dbConfig = require("../config/dbConfig");
    const sqlHandler = mysql.createConnection(dbConfig);
    const sqlCommand = require("../sqlTemplate/sqlCommand");

    sqlHandler.connect((err) => {
        if (err) throw err;
        sqlHandler.query(sqlCommand["updateData"], [isLiked, id], (err, data) => {
            if (err) throw err;
            console.log(`[UPDATE DONE] id: ${id}, isLiked: ${isLiked}`);
            res.send(`UPDATE DONE`);

            // == End connection ==
            sqlHandler.end();
        });
    });


}

module.exports = likeStatus;