const sqlite = require('sqlite3').verbose();
const fs = require('fs');

//Database handler

function isInDataBase(id, query) {
    return new Promise((resolve, reject) => {
        let db = new sqlite.Database('./database.db', sqlite.OPEN_READONLY);
        if (!query) reject(`Query Not Valid`);
        //let query = `SELECT * FROM ${table} WHERE id = ?`;

        db.get(query, [id], function(err, row) {
            if (err) {
                reject(err);
            }
            if (row == undefined) {
                resolve([false]);
            }
            db.close();
            resolve([true, row]);
        });
    });
};

function getData(id, query) {
    return new Promise((resolve, reject) => {
        let db = new sqlite.Database('./database.db', sqlite.OPEN_READONLY);
        if (!query) reject(`Query Not Valid`);
        //let query = `SELECT * FROM ${table} WHERE id = ?`;

        db.serialize(() => {
            db.get(query, [id], function(err, row) {
                if (err) {
                    reject(`An error occured while fetching data. Please report this. ${err}`);
                }
                if (row == undefined) {
                    reject(`An error occured while fetching data. Please report this: The row was undefined in a getData function.`);
                }
                db.close();
                resolve(row)
            });
        });
    });
};

function changeData(id, query, data) { //data and query switched spots
    return new Promise((resolve, reject) => {
        if (!query) reject(`Query Not Valid`);
        let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE);
        //let query = `UPDATE table SET offline = ? WHERE id = ?`

        db.serialize(() => {
            db.run(query, [data, id], function(err) {
                if (err) {
                    reject(`An error occured while writing data. Please report this. ${err}`);
                }
                db.close();
                resolve();

            });
        });
    });
};

function newRow(query, data) {
    return new Promise((resolve, reject) => {
        let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE);

        db.serialize(() => {
            db.run(query, data, function(err) {
                if (err) {
                    reject(`An error occured while writing data. Please report this. ${err}`);
                }
                db.close();
                resolve();
            });
        })
    });
}

//getrow removed, may cause unknown errors, but should have been properly removed
//Update, seems ok, but keeping this note here just in case

function getUserCount() { //Used only by the user table
    return new Promise((resolve, reject) => {
        let db = new sqlite.Database('./database.db', sqlite.OPEN_READONLY);

        db.serialize(() => {
            db.get(`SELECT count(1) FROM users`, function(err, row) {
                if (err) {
                    reject(`An error occured while fetching data. Please report this. ${err}`);
                }
                db.close();
                resolve(row);
            });
        });
    });
};

function getTable(table) {
    return new Promise((resolve, reject) => {
        if (!table) reject(`Table Not Valid`);
        let db = new sqlite.Database('./database.db', sqlite.OPEN_READONLY);

        db.serialize(() => {
            db.all(`SELECT * FROM ${table}`, function(err, tabledata) {
                if (err) {
                    reject(`An error occured while fetching data. Please report this. ${err}`);
                }
                db.close();
                resolve(tabledata);
            });
        });
    });
};

function deleteData(id, query) {
    return new Promise((resolve, reject) => {
        if (!query) reject(`Table Not Valid`);
        let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE);
        //let query = `DELETE FROM ${table} WHERE id=(?)`

        db.serialize(() => {
            db.run(query, id, function(err) {
                if (err) {
                    reject(`An error occured while deleting data. Please report this. ${err}`);
                }
                db.close();
                resolve();
            });
        });
    });
};                  

module.exports = { isInDataBase, getData, changeData, deleteData, newRow, getUserCount, getTable };