
const pg = require('pg');
const express = require('express')
const router = express.Router();

const ExpressError = require('../expressError');
const db = require('../db.js');

router.get('/', async (req, res, next) => {
  
  let query = await db.query("SELECT code, name, description FROM companies")
  return res.json({companies: query.rows});
})


router.get('/:code', async (req, res, next) => {

  try {
    let companyQuery = await db.query(`SELECT code, name, description
                                      FROM companies
                                      WHERE code=$1`, [req.params.code]);

    if (companyQuery.rows.length == 0) {
      return next(new ExpressError("Not found", 404));
    } else {

      let invoiceQuery = await db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date
                                         FROM invoices
                                         WHERE comp_code=$1`,
                                         [req.params.code])

      companyQuery.rows[0].invoices = invoiceQuery.rows;

      return res.json({company: companyQuery.rows[0]})
    }
  } catch(e) {
    return next(new ExpressError(e.message, 404));
  }


})

router.post('/', async (req, res, next) => {

  const {code, name, description} = req.body

  try {
    let result = await db.query(`INSERT INTO companies 
                                (code, name, description)
                                VALUES ($1, $2, $3)
                                RETURNING code, name, description`,
                                [code, name, description]);
    res.json({company: result.rows[0]});
  } catch(e) {
    return next(new ExpressError(e.message, 404))
  }
})



router.put('/:code', async (req, res, next) => {

  const {name, description} = req.body;

  try {

    let companyQuery = await db.query(`SELECT code, name, description
                                      FROM companies
                                      WHERE code=$1`, [req.params.code]);

    if (companyQuery.rows.length == 0) {
      return next(new ExpressError("Not found", 404));
    } else{
      let result = await db.query(`UPDATE companies
                                  SET name=$2, description=$3 
                                  WHERE code=$1
                                  RETURNING code, name, description`, 
                                  [req.params.code, name, description]);
      res.json({company: result.rows[0]})
    }
  } catch(e) {
    return next(new ExpressError(e.message, 404))
  }
})

router.delete('/:code', async (req, res, next) => {

  try {

    let companyQuery = await db.query(`SELECT code, name, description
                                      FROM companies
                                      WHERE code=$1`, [req.params.code]);

    if (companyQuery.rows.length == 0) {
      return next(new ExpressError("Not found", 404));
    } else {
      let result = await db.query(`DELETE FROM companies
                                  WHERE code=$1`, 
                                  [req.params.code]);
      res.json({status: "deleted"})
    }

  } catch(e) {
    return next(new ExpressError(e.message, 404))
  }
})



module.exports = router;