
// const pg = require('pg');
const express = require('express')
const slugify = require('slugify');
const router = express.Router();

const ExpressError = require('../expressError');
const db = require('../db.js');

router.get('/', async (req, res, next) => {
  // get all industries, show all associated companies
  try {
    let [industries, company_industries] = await Promise.all([
      db.query(
        `SELECT ind.code, ind.industry
        FROM industries as ind`
      ),
      db.query(
        `SELECT ci.company_code, ci.industry_code
        FROM company_industries as ci`
      )
    ])

    for (let industry_row of industries.rows) {
      // industry_row.companies = [];
      let ci = company_industries.rows.filter(ci => ci.industry_code == industry_row.code);
      industry_row.companies = ci.map(ci => ci.company_code)
    }
    res.json({industries: industries.rows})

  } catch(e) {
    return next(new ExpressError(e.message, 404))
  }
})

router.post('/', async (req, res, next) => {
  // create a new industry
  try {
    const {code, industry} = req.body;

    let createQuery = await db.query(
      `INSERT INTO industries
      (code, industry)
      VALUES ($1, $2)
      RETURNING code, industry`,
      [code, industry]
    )

    if (createQuery.rows.length == 0) {
      return next(new ExpressError("Could not create industry", 404))
    } else {
      return res.json({industry: createQuery.rows[0]})
    }

  } catch(e) {
    return next(new ExpressError(e.message, 404))
  }
})

router.post('/assign-company/:industry_code', async (req, res, next) => {
  // assign company to industry
  try{

    let [assignQuery] = await Promise.all([
      db.query(
        `INSERT INTO company_industries
        (company_code, industry_code)
        VALUES ($1, $2)
        RETURNING company_code, industry_code`,
        [req.body.company_code, req.params.industry_code]
      )
    ])

    if (assignQuery.rows.length == 0) {
      
      return next(new ExpressError("Could not create association", 404))

    } else {
      res.json({company_industry: assignQuery.rows[0]})
    }
  } catch(e) {
    return next(new ExpressError(e.message, 404))
  }
})

module.exports = router;