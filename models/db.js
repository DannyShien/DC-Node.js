// ============================================
// Database Connection 
const pgp = require('pg-promise')({
    // - ONLY GOOD FOR DEBUGGING
    query: e => {      
        console.log('QUERY: ', e.query);
        if (e.params) {
            console.log('PARAMS:', e.params);
        }       
    }
});
// console.log(process.env.DB_NAME);
// console.log('DB name');

const db = pgp({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});
// ============================================

module.exports = db;