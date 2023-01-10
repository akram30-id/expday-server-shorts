const express = require('express')
const bodyParser = require('body-parser')
const koneksi = require('./config/database')
const crypto = require('crypto')
const cors = require('cors')

const app = express()
const port = 5000

// set body-parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// set cors header
app.use(cors())

const date = new Date()
const date_now = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`

// create data/insert data
app.post('/quotes', (req, res) => {

    // variabel penampung post
    // const data = { ...req.body }
    const id = crypto.randomBytes(16).toString("hex")

    const data = {
        id_quotes: id,
        quotes: req.body.quotes,
        quotes_by: req.body.quotes_by,
        created_at: date_now,
        updated_at: null
    }

    const queryInsert = "INSERT INTO tbl_quotes SET ?"
    const queryInsertToMainTable = "INSERT INTO tbl_shorts SET id_quotes=?"

    // execute query
    koneksi.query(queryInsert, data, (err, result, fields) => {
        // error handling
        if (err) {
            res.status(500).json({
                message: 'Gagal insert data',
                error: err
            })
        } else {
            koneksi.query(queryInsertToMainTable, id, (err, result, field) => {
                if (err) {
                    res.status(500).json({
                        success: false,
                        message: 'Gagal tambah quotes',
                        error: err
                    })
                } else {
                    res.status(201).json({
                        success: true,
                        message: "Tambah quotes berhasil",
                        data: data
                    })
                }
            })
        }
    })

})

app.get('/quotes/page/:page', (req, res) => {

    const querySelectAll = "SELECT * FROM tbl_quotes ORDER BY created_at DESC"

    // execute query
    koneksi.query(querySelectAll, (err, result, field) => {
        if (err) {
            res.status(500).json({
                message: 'Internal server error',
                error: err
            })
        } else {
            const pageCount = Math.ceil(result.length / 9)
            let page = parseInt(req.params.page)

            if (page <= 1 || !page) {
                page = 1
            }

            if (page > pageCount) {
                page = pageCount
            }

            res.status(200).json({
                success: true,
                page: page,
                page_count: pageCount,
                data: result.slice((page * 9) - 9, page * 9)
                // data: result.length
            })
        }
    })

})

app.get('/quotes/:id', (req, res) => {

    const querySearchSpecific = "SELECT * FROM tbl_quotes WHERE id_quotes = ?"

    // execute query
    koneksi.query(querySearchSpecific, req.params.id, (err, result, field) => {
        if (err) {
            res.status(500).json({
                message: 'Internal server error',
                error: err
            })
        } else {
            if (result.length < 1) {
                res.status(404).json({
                    message: 'No Data found',
                })
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Data found',
                    data: result
                })
            }
        }
    })

})

app.put('/quotes/:id', (req, res) => {

    const data = {
        quotes: req.body.quotes,
        quotes_by: req.body.quotes_by,
        updated_at: date_now
    }

    const querySearchData = "SELECT * FROM tbl_quotes WHERE id_quotes=?"
    const queryUpdateData = "UPDATE tbl_quotes SET ? WHERE id_quotes=?"

    // execute query search
    koneksi.query(querySearchData, req.params.id, (err, result, field) => {
        if (err) {
            res.status(500).json({
                message: 'Internal server error',
                error: err
            })
        } else {
            if (result.length) {
                // execute query update
                koneksi.query(queryUpdateData, [data, result[0].id_quotes], (err, result, field) => {
                    if (err) {
                        res.status(500).json({
                            message: 'Internal server error',
                            error: err
                        })
                    } else {
                        res.status(200).json({
                            success: true,
                            message: 'Update quotes berhasil',
                            data: data,
                        })
                    }
                })
            } else {
                res.status(404).json({
                    message: 'Data not found',
                })
            }

        }
    })

})

app.delete('/quotes/:id', (req, res) => {

    const querySearchData = "SELECT * FROM tbl_quotes WHERE id_quotes=?"
    const queryDeleteData = "DELETE FROM tbl_quotes WHERE id_quotes=?"

    // execute query search
    koneksi.query(querySearchData, req.params.id, (err, result, field) => {
        if (err) {
            res.status(500).json({
                message: 'Internal server error',
                error: err
            })
        } else {
            if (result.length) {
                // execute query delete
                koneksi.query(queryDeleteData, result[0].id_quotes, (err, result, field) => {
                    res.status(200).json({
                        success: true,
                        message: 'Data berhasil dihapus',
                    })
                })
            } else {
                res.status(404).json({
                    message: 'Data not found',
                })
            }
        }
    })

})

app.listen(port, () => console.info(`Server running on port ${port}`))