const Database = require('better-sqlite3');
const fs = require('fs');

//Database handler

function createTable(query) {
    return new Promise((resolve, reject) => {
        if (!query) reject(`Query Not Valid`);
        let db = new Database('./database.db');
        //'CREATE TABLE IF NOT EXISTS servers(tests TEXT NOT NULL)'

        try {
            let table = db.prepare(query);
            table.run();
            db.close();
            resolve();
        } catch (err) {
            err.name = 'SQLiteError';
            reject(err);
        }
    });
};

function isInDataBase(id, query) {
    return new Promise((resolve, reject) => {
        if (!query) reject(`Query Not Valid`);
        let db = new Database('./database.db', { readonly: true });
        //let query = `SELECT * FROM ${table} WHERE id = ?`;

        try {
            let preparedQuery = db.prepare(query);
            let userData = preparedQuery.get(id);
            db.close();
            if (userData == undefined) resolve([false]);
            resolve([true, userData]);
        } catch (err) {
            err.name = 'SQLiteError';
            reject(err);
        }
    });
};

function getData(id, query) {
    return new Promise((resolve, reject) => {
        if (!query) reject(`Query Not Valid`);
        let db = new Database('./database.db', { readonly: true });
        //let query = `SELECT * FROM ${table} WHERE id = ?`;

        try {
            let preparedQuery = db.prepare(query);
            let userData = preparedQuery.get(id);
            db.close();
            if (userData == undefined) {
                let rowUndefined = new Error('Row is undefined');
                rowUndefined.name = 'SQLiteError';
                reject(rowUndefined);
            }
            resolve(userData);
        } catch (err) {
            err.name = 'SQLiteError';
            reject(err);
        }
    });
};

function changeData(id, query, data) { //data and query switched spots
    return new Promise((resolve, reject) => {
        if (!query) reject(`Query Not Valid`);
        let db = new Database('./database.db');
        //let query = `UPDATE table SET offline = ? WHERE id = ?`

        try {
            let preparedQuery = db.prepare(query);
            preparedQuery.run([data, id]);
            db.close();
            resolve();
        } catch (err) {
            err.name = 'SQLiteError';
            reject(err);
        }
    });
};

function newRow(query, data) {
    return new Promise((resolve, reject) => {
        let db = new Database('./database.db');
        //`INSERT INTO servers VALUES(?,?,?)`

        try {
            let preparedQuery = db.prepare(query);
            preparedQuery.run(data);
            db.close();
            resolve();
        } catch (err) {
            err.name = 'SQLiteError';
            reject(err);
        }
    });
}

//getrow removed, may cause unknown errors, but should have been properly removed
//Update, seems ok, but keeping this note here just in case

function getUserCount() { //Used only by the user table
    return new Promise((resolve, reject) => {
        let db = new Database('./database.db', { readonly: true });

        try {
            let preparedQuery = db.prepare(`SELECT count(1) FROM users`);
            let userCount = preparedQuery.get();
            db.close();
            resolve(userCount);
        } catch (err) {
            err.name = 'SQLiteError';
            reject(err);
        }
    });
};

function getTable(table) {
    return new Promise((resolve, reject) => {
        if (!table) reject(`Table Not Valid`);
        let db = new Database('./database.db', { readonly: true });

        try {
            let preparedQuery = db.prepare(`SELECT * FROM ${table}`);
            let tableData = preparedQuery.all();
            db.close();
            resolve(tableData);
        } catch (err) {
            err.name = 'SQLiteError';
            reject(err);
        }
    });
};

function deleteData(id, query) {
    return new Promise((resolve, reject) => {
        if (!query) reject(`Table Not Valid`);
        let db = new Database('./database.db');
        //let query = `DELETE FROM users WHERE id=(?)`

        try {
            let preparedQuery = db.prepare(query);
            let tableData = preparedQuery.run(id);
            db.close();
            resolve(tableData);
        } catch (err) {
            err.name = 'SQLiteError';
            reject(err);
        }
    });
};                  

module.exports = { createTable, isInDataBase, getData, changeData, deleteData, newRow, getUserCount, getTable };