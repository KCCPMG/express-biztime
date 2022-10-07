
// const pg = require('pg');
const express = require('express')
const slugify = require('slugify');
const router = express.Router();

const ExpressError = require('../expressError');
const db = require('../db.js');

router.get('/', async (req, res, next) => {
  
  let query = await db.query("SELECT code, name, description FROM companies")
  return res.json({companies: query.rows});
})


router.get('/:code', async (req, res, next) => {

  try {

    let [fullQuery, invoiceQuery] = await Promise.all([
                                  db.query(`SELECT comp.code, comp.name, 
                                  comp.description, ind.industry
                                  FROM companies as comp
                                  LEFT JOIN company_industries as comp_ind
                                  ON comp.code = comp_ind.company_code
                                  LEFT JOIN industries as ind
                                  ON comp_ind.industry_code = ind.code  
                                  WHERE comp.code=$1`, 
                                  [req.params.code]),
                                  db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date
                                  FROM invoices
                                  WHERE comp_code=$1`,
                                  [req.params.code])
                                ]);

    if (fullQuery.rows.length == 0) {
      return next(new ExpressError("Not found", 404));
    } else {
      let code = fullQuery.rows[0].code;
      let name = fullQuery.rows[0].name;
      let description = fullQuery.rows[0].description;
      let industries = fullQuery.rows.map(r => r.industry)
      res.json({company: {
        code,
        name,
        description,
        industries,
        invoices: invoiceQuery.rows
      }})
    }

  } catch(e) {
    return next(new ExpressError(e.message, 404));
  }


})

router.post('/', async (req, res, next) => {

  const {name, description} = req.body

  try {
    let result = await db.query(`INSERT INTO companies 
                                (code, name, description)
                                VALUES ($1, $2, $3)
                                RETURNING code, name, description`,
                                [slugify(name), name, description]);
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
                                      WHERE code=$1`, 
                                      [req.params.code]);

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