const mysql = require('mysql')

const koneksi = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'expday-shorts'
})

koneksi.connect((err) => {
    if (err) {
        throw err
    } else {
        console.info('MySQL Connected')
    }
})

module.exports = koneksi