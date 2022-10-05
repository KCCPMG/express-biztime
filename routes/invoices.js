const pg = require('pg');
const express = require('express')
const router = express.Router();

const ExpressError = require('../expressError');
const db = require('../db.js');


router.get('/', async (req, res, next) => {
  try {
    let query = await db.query("SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices")
    return res.json({invoices: query.rows});
  } catch(e) {
    return next(new ExpressError(e.message, 404));
  } 
})


router.get('/:id', async (req, res, next) => {
  try {
    let query = await db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date
                                FROM invoices
                                WHERE id=$1`,
                                [req.params.id])

    if (query.rows.length == 0) {
      return next(new ExpressError("Could not find invoice", 404))
    } else return res.json({invoice: query.rows[0]})
    
  } catch(e) {
    return next(new ExpressError(e.message, 404));
  } 
})


router.post('/', async (req, res, next) => {
  try {
    const {comp_code, amt} = req.body;

    let query = await db.query(`INSERT INTO invoices
                                (comp_code, amt)
                                VALUES ($1, $2)
                                RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
                                [comp_code, amt])
    return res.json({invoice: query.rows[0]})
  } catch(e) {
    return next(new ExpressError(e.message, 404));
  } 
})


router.put('/:id', async (req, res, next) => {

  const { amt } = req.body;

  try {
    let query = await db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date
                                FROM invoices
                                WHERE id=$1`,
                                [req.params.id])

    if (query.rows.length == 0) {
      return next(new ExpressError("Could not find invoice", 404))
    } else {

      let query = await db.query(`UPDATE invoices
                                  SET amt=$1
                                  WHERE id=$2
                                  RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                                  [amt, req.params.id])

      return res.json({invoice: query.rows[0]})
    }
  } catch(e) {
    return next(new ExpressError(e.message, 404));
  } 
})


router.delete('/:id', async (req, res, next) => {
  try {

    let query = await db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date
                                FROM invoices
                                WHERE id=$1`,
                                [req.params.id])

    if (query.rows.length == 0) {
      return next(new ExpressError("Could not find invoice", 404))
    } else {
      let query = await db.query(`DELETE FROM invoices
                                  WHERE id=$1`, 
                                  [req.params.id])
      return res.json({status: "deleted"})
    }
  } catch(e) {
    return next(new ExpressError(e.message, 404));
  } 
})


module.exports = router;