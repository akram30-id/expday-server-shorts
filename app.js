const express = require('express')
const bodyParser = require('body-parser')
const koneksi = require('./config/database')
const crypto = require('crypto')
const cors = require('cors')
require('express-group-routes')

const app = express()
const port = 5100

// set body-parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// set cors header
app.use(cors())

const date = new Date()
const date_now = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`

// QUOTES MODULE
app.group('/quotes', (router) => {

    // create data/insert data
    router.post('', (req, res) => {

        // variabel penampung post
        // const data = { ...req.body }
        const id = crypto.randomBytes(16).toString("hex")

        const data = {
            id_quotes: id,
            quotes: req.body.quotes,
            quotes_by: req.body.quotes_by,
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

    router.get('/page/:page', (req, res) => {

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

    router.get('/:id', (req, res) => {

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

    router.put('/:id', (req, res) => {

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

    router.delete('/:id', (req, res) => {

        const querySearchData = "SELECT * FROM tbl_quotes WHERE id_quotes=?"
        const queryDeleteDataMain = "DELETE FROM tbl_shorts WHERE id_quotes=?"
        const queryDeleteData = "DELETE FROM tbl_quotes WHERE id_quotes=?"

        const querySearchForeignKey = "SELECT * FROM tbl_footages WHERE id_quotes=?"
        const queryDeleteForeignKey = "DELETE FROM tbl_footages WHERE id_quotes=?"

        const deleteData = () => {
            return koneksi.query(queryDeleteData, req.params.id, (err, result, field) => {
                if (err) {
                    res.status(500).json({
                        message: 'Internal server error',
                        error: err
                    })
                } else {
                    res.status(200).json({
                        success: true,
                        message: 'Data berhasil dihapus',
                    })
                }
            })
        }

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
                    koneksi.query(queryDeleteDataMain, result[0].id_quotes, (err, result, field) => {
                        if (err) {
                            res.status(500).json({
                                message: 'Internal server error',
                                error: err
                            })
                        } else {
                            koneksi.query(querySearchForeignKey, req.params.id, (err, result, field) => {
                                if (err) {
                                    res.status(500).json({
                                        message: 'Internal Server Error',
                                        error: err
                                    });
                                } else {
                                    if (result.length) {
                                        koneksi.query(queryDeleteForeignKey, req.params.id, (err, result, field) => {
                                            if (err) {
                                                res.status(500).json({
                                                    message: 'Internal Server Error',
                                                    error: err
                                                });
                                            }
                                        })
                                    }
                                    deleteData()
                                }
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

})


// FOOTAGES MODULE
app.group('/footages', (router) => {
    router.post('', (req, res) => {

        const data = {
            'id_quotes': req.body.id,
            'footage_link': req.body.footage_link
        }

        const cekQuotes = "SELECT * FROM tbl_quotes WHERE id_quotes=?"
        const queryInsertFootage = "INSERT INTO tbl_footages SET ?"

        koneksi.query(cekQuotes, data.id_quotes, (err, result, field) => {
            if (err) {
                res.status(500).json({
                    message: 'Internal Server Error',
                    error: err
                });
            } else {
                if (result.length) {
                    koneksi.query(queryInsertFootage, data, (err, result, field) => {
                        if (err) {
                            res.status(500).json({
                                message: 'Internal Server Error',
                                error: err
                            })
                        } else {
                            res.status(201).json({
                                success: true,
                                message: 'Link Footage Berhasil Ditambahkan',
                            })
                        }
                    })
                } else {
                    res.status(404).json({
                        success: false,
                        message: 'Quotes Not Found',
                    });
                }
            }
        })

    })

    router.get('/page/:page', (req, res) => {

        const queryGetListQuotes = "SELECT * FROM tbl_quotes ORDER BY created_at DESC"
        const queryGetListFootages = "SELECT id_footage, footage_link, id_quotes FROM tbl_footages"

        koneksi.query(queryGetListQuotes, (err, result, field) => {
            if (err) {
                res.status(500).json({
                    message: 'Internal Server Error',
                    error: err
                });
            } else {
                koneksi.query(queryGetListFootages, (err, rows, field) => {
                    if (err) {
                        res.status(500).json({
                            message: 'Internal Server Error',
                            error: err
                        });
                    } else {
                        const data = []
                        for (let i = 0; i < result.length; i++) {
                            data.push({
                                id_quotes: result[i].id_quotes,
                                quotes: result[i].quotes,
                                quotes_by: result[i].quotes_by,
                                link: []
                            })
                            // data[result[i].quotes] = []
                            for (let j = 0; j < rows.length; j++) {
                                if (result[i].id_quotes == rows[j].id_quotes) {
                                    // data[result[i].quotes].push(rows[j].footage_link)
                                    data[i].link.push({
                                        id_footage: rows[j].id_footage,
                                        footage_link: rows[j].footage_link,
                                    })
                                }
                            }
                        }

                        const pageCount = Math.ceil(result.length / 10)
                        let page = parseInt(req.params.page)

                        if (page <= 1 || !page) {
                            page = 1
                        }

                        if (page > pageCount) {
                            page = pageCount
                        }

                        res.status(200).json({
                            success: true,
                            message: 'Sukses',
                            page: page,
                            page_count: pageCount,
                            data: data.slice((page * 10) - 10, page * 10)
                        });
                    }
                })
            }
        })

    })

    router.delete('/:id', (req, res) => {

        const id = req.params.id

        const queryFindFootage = "SELECT * FROM tbl_footages WHERE id_footage=?"
        const queryDeleteFootage = "DELETE FROM tbl_footages WHERE id_footage=?"

        koneksi.query(queryFindFootage, id, (err, footage, field) => {
            if (err) {
                res.status(500).json({
                    message: 'Internal Server Error',
                    error: err
                });
            } else {
                if (footage.length) {
                    koneksi.query(queryDeleteFootage, id, (err, footage, field) => {
                        if (err) {
                            res.status(500).json({
                                message: 'Internal Server Error',
                                error: err
                            });
                        } else {
                            res.status(200).json({
                                success: true,
                                message: 'Berhasil Menghapus Footage',
                            });
                        }
                    })
                } else {
                    res.status(404).json({
                        message: 'No Data Found',
                        error: err
                    });
                }
            }
        })

    })
})

// SHORTS MODULE
app.get('/shorts', (req, res) => {

    const draw = req.query.draw;

    let start = req.query.start;

    const length = req.query.length;

    const order_data = req.query.order;

    let column_name = ''
    let column_sort_order = ''

    if (order_data == undefined) {
        column_name = 'tbl_shorts.id_shorts';
        column_sort_order = 'desc';
    } else {
        const column_index = req.query.order[0]['column'];
        column_name = req.query.columns[column_index]['data'];
        column_sort_order = req.query.order[0]['dir'];
    }

    //search data
    const search_value = req.query.search['value'];

    let search_query = ''
    if (search_value != undefined) {
        search_query = `
         AND (quotes LIKE '%${search_value}%' 
          OR quotes LIKE '%${search_value}%' 
         )
        `;
    }

    //Total number of records without filtering
    koneksi.query("SELECT COUNT(*) AS total FROM tbl_shorts INNER JOIN tbl_quotes ON tbl_shorts.id_quotes=tbl_quotes.id_quotes", function (err, data) {

        if (err) {
            res.status(500).json({
                message: 'Internal Server Error',
                error: err
            });
        } else {
            const total_records = data[0].total;

            //Total number of records with filtering
            koneksi.query(`SELECT COUNT(*) AS total FROM tbl_shorts INNER JOIN tbl_quotes ON tbl_shorts.id_quotes=tbl_quotes.id_quotes WHERE 1 ${search_query}`, function (err, data) {
                if (err) {
                    res.status(500).json({
                        message: 'Internal Server Error',
                        error: err
                    });
                } else {
                    const total_records_with_filter = data[0].total;

                    const query = `SELECT * FROM tbl_shorts INNER JOIN tbl_quotes ON tbl_shorts.id_quotes=tbl_quotes.id_quotes WHERE 1 ${search_query} ORDER BY ${column_name} ${column_sort_order} LIMIT ${start}, ${length}`;

                    const data_arr = [];

                    koneksi.query(query, function (err, data) {
                        if (err) {
                            res.status(500).json({
                                message: 'Internal Server Error',
                                error: err
                            });
                        } else {
                            start = parseInt(start) + 1
                            const stateNull = (column, id_shorts) => {
                                return `
                                    <button href="#" style="font-size: 10pt;" data-bs-toggle="modal" data-bs-target="#staticBackdrop" data-id="${id_shorts}" class="btn btn-sm text-center btn-primary ${column}"><i class="bi bi-upload"></i></button>
                                `
                            }

                            const stateNotNull = (columnWatch, columnDelete, id_shorts) => {
                                return `
                                    <button href="#" style="font-size: 10pt;" data-bs-toggle="modal" data-bs-target="#staticBackdrop" data-id="${id_shorts}" class="btn btn-sm text-center btn-outline-primary ${columnWatch}"><i class="bi bi-play"></i></button>

                                    <button href="#" style="font-size: 10pt;" data-id="${id_shorts}" class="btn btn-sm text-center btn-outline-danger ${columnDelete}"><i class="bi bi-trash3"></i></button>
                                `
                            }

                            data.forEach(function (row) {
                                let editing_result = ''
                                let tiktok = ''
                                let instagram = ''

                                if (row.editing_result != null || row.editing_result != undefined) {
                                    editing_result = stateNotNull('btn-watch-editing', 'btn-delete-editing', row.id_shorts)

                                    if (row.tiktok != null || row.tiktok != undefined) {
                                        tiktok = stateNotNull('btn-watch-tiktok', 'btn-delete-tiktok', row.id_shorts)

                                        if (row.instagram != null || row.instagram != undefined) {
                                            instagram = stateNotNull('btn-watch-instagram', 'btn-delete-instagram', row.id_shorts)
                                        } else {
                                            instagram = stateNull('btn-upload-instagram', row.id_shorts)
                                        }
                                    } else {
                                        tiktok = stateNull('btn-upload-tiktok', row.id_shorts)

                                        if (row.instagram != null || row.instagram != undefined) {
                                            instagram = stateNotNull('btn-watch-instagram', 'btn-delete-instagram', row.id_shorts)
                                        } else {
                                            instagram = stateNull('btn-upload-instagram', row.id_shorts)
                                        }
                                    }
                                } else {
                                    editing_result = stateNull('btn-upload-editing', row.id_shorts)

                                    if (row.tiktok != null || row.tiktok != undefined) {
                                        tiktok = stateNotNull('btn-watch-tiktok', 'btn-delete-tiktok', row.id_shorts)

                                        if (row.instagram != null || row.instagram != undefined) {
                                            instagram = stateNotNull('btn-watch-instagram', 'btn-delete-instagram', row.id_shorts)
                                        } else {
                                            instagram = stateNull('btn-upload-instagram', row.id_shorts)
                                        }
                                    } else {
                                        tiktok = stateNull('btn-upload-tiktok', row.id_shorts)

                                        if (row.instagram != null || row.instagram != undefined) {
                                            instagram = stateNotNull('btn-watch-instagram', 'btn-delete-instagram', row.id_shorts)
                                        } else {
                                            instagram = stateNull('btn-upload-instagram', row.id_shorts)
                                        }
                                    }
                                }

                                data_arr.push({
                                    'no': start++,
                                    'id_shorts': row.id_shorts,
                                    'id_quotes': row.id_quotes,
                                    'quotes': row.quotes + '<br>(by ' + row.quotes_by + ')',
                                    'editing_result': editing_result,
                                    'tiktok': tiktok,
                                    'instagram': instagram
                                });
                            });

                            const output = {
                                'draw': draw,
                                'iTotalRecords': total_records,
                                'iTotalDisplayRecords': total_records_with_filter,
                                'aaData': data_arr
                            };

                            res.status(200).json(output);
                        }
                    });
                }

            });
        }

    });


})

app.get('/shorts/all/:page', (req, res) => {
    const queryAllShorts = "SELECT editing_result FROM tbl_shorts WHERE tbl_shorts.editing_result != ''"

    koneksi.query(queryAllShorts, (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Internal Server Error',
                error: err
            });
        } else {
            if (result.length) {
                const pageCount = Math.ceil(result.length / 3)
                let page = parseInt(req.params.page)
    
                if (page <= 1 || !page) {
                    page = 1
                }
    
                if (page > pageCount) {
                    page = pageCount
                }
    
                res.status(200).json({
                    success: true,
                    status: 200,
                    message: 'Sukses',
                    page: page,
                    total_page: pageCount,
                    data: result.slice((page * 3) - 3, page * 3)
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'No Data Available',
                    error: err
                });
            }
        }
    })
})

app.get('/shorts/latest', (req, res) => {
    const queryLatest = "SELECT tbl_shorts.editing_result FROM tbl_shorts INNER JOIN tbl_quotes ON tbl_shorts.id_quotes=tbl_quotes.id_quotes WHERE tbl_shorts.editing_result != '' ORDER BY tbl_quotes.created_at DESC LIMIT 6;"

    koneksi.query(queryLatest, (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Internal Server Error',
                error: err
            });
        } else {
            if (result.length) {
                res.status(200).json({
                    success: true,
                    message: 'Sukses',
                    data: result
                });
            } else {
                res.status(404).json({
                    message: 'No Data Avalible',
                    error: err
                });
            }
        }
    })
})

app.group('/shorts/upload', (router) => {

    const update = (field, id_shorts, res) => {
        const queryUpdate = `UPDATE tbl_shorts SET ${field} WHERE id_shorts=${id_shorts}`
        return koneksi.query(queryUpdate, (err, result) => {
            if (err) {
                res.status(500).json({
                    message: 'Internal Server Error',
                    error: err
                });
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Berhasil Update',
                });
            }
        })
    }

    // EDITING RESULT upload
    router.put('/editing/:id_shorts', (req, res) => {
        const link_editing = req.body.link_editing
        const id_shorts = req.params.id_shorts

        if (link_editing != null || link_editing != undefined) {
            update(`editing_result="${link_editing}"`, id_shorts, res)
        } else {
            update(`editing_result=NULL`, id_shorts, res)
        }
    })

    // TIKTOK LINK upload
    router.put('/tiktok/:id_shorts', (req, res) => {
        const link_tiktok = req.body.link_tiktok
        const id_shorts = req.params.id_shorts

        if (link_tiktok != null || link_tiktok != undefined) {
            update(`tiktok="${link_tiktok}"`, id_shorts, res)
        } else {
            update(`tiktok=NULL`, id_shorts, res)
        }
    })

    // TIKTOK LINK upload
    router.put('/instagram/:id_shorts', (req, res) => {
        const link_instagram = req.body.link_instagram
        const id_shorts = req.params.id_shorts

        if (link_instagram != null || link_instagram != undefined) {
            update(`instagram="${link_instagram}"`, id_shorts, res)
        } else {
            update(`instagram=NULL`, id_shorts, res)
        }
    })

})

app.group('/shorts/show', (router) => {

    const show = (field, id_shorts, res) => {
        const queryShow = `SELECT ${field} FROM tbl_shorts WHERE id_shorts=${id_shorts}`

        koneksi.query(queryShow, (err, result) => {
            if (err) {
                res.status(500).json({
                    message: 'Internal Server Error',
                    error: err
                });
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Data Found',
                    data: result
                });
            }
        })
    }

    router.get('/editing/:id', (req, res) => {
        const id = req.params.id
        const field = 'editing_result'
        show(field, id, res)
    })

    router.get('/tiktok/:id', (req, res) => {
        const id = req.params.id
        const field = 'tiktok'
        show(field, id, res)
    })

    router.get('/instagram/:id', (req, res) => {
        const id = req.params.id
        const field = 'instagram'
        show(field, id, res)
    })

})


app.listen(port, () => console.info(`Server running on port ${port}`))