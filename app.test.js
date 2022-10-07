process.env.NODE_ENV = "test";
const request = require("supertest");
const pg = require('pg');
const slugify = require('slugify');

const app = require("./app")
const db = require('./db.js');

describe("Tests for all routes", function(){

  const TEST_COMPANY_NAME = 'Test Company';
  const TEST_COMPANY_CODE = slugify(TEST_COMPANY_NAME);
  const TEST_INDUSTRY_NAME = 'Test Industry';
  const TEST_INDUSTRY_CODE = slugify(TEST_INDUSTRY_NAME);

  afterEach(async function() {
    await Promise.all([
      db.query('DELETE FROM companies WHERE code = $1', [TEST_COMPANY_CODE]),
      db.query('DELETE FROM invoices WHERE comp_code = $1', [TEST_COMPANY_CODE]),
      db.query('DELETE FROM industries WHERE code = $1', [TEST_INDUSTRY_CODE])
    ])
  })

  test("GET /companies", async function(){
    const resp = await request(app).get('/companies');

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual(
      {
        companies: [
            {
                code: "apple",
                name: "Apple Computer",
                description: "Maker of OSX."
            },
            {
                code: "ibm",
                name: "IBM",
                description: "Big blue."
            }
        ]
      }
    )
  })

  test("GET /companies/:code", async function(){
    const resp = await request(app).get('/companies/apple');

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual(
      {
        "company": {
          "code": "apple",
          "name": "Apple Computer",
          "description": "Maker of OSX.",
          "industries": [
            "Computers",
            "Software"
          ],
          "invoices": [
            {
              "id": 1,
              "comp_code": "apple",
              "amt": 100,
              "paid": false,
              "add_date": "2022-10-05T07:00:00.000Z",
              "paid_date": null
            },
            {
              "id": 2,
              "comp_code": "apple",
              "amt": 200,
              "paid": false,
              "add_date": "2022-10-05T07:00:00.000Z",
              "paid_date": null
            },
            {
              "id": 3,
              "comp_code": "apple",
              "amt": 300,
              "paid": true,
              "add_date": "2022-10-05T07:00:00.000Z",
              "paid_date": "2018-01-01T08:00:00.000Z"
            }
          ]
        }
      }
    )
  })

  test("POST /companies", async function(){
    let description = "Test work"

    const resp = await request(app).post('/companies').send({
      name: TEST_COMPANY_NAME,
      description
    })

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      company: {
        code: TEST_COMPANY_CODE,
        name: TEST_COMPANY_NAME,
        description
      }
    })
  })

  test("PUT /companies/:code", async function(){

    let name = 'Wacky Test Name';
    let description = 'Wacky test description';

    await db.query(`INSERT INTO companies 
                    (code, name, description) 
                    VALUES ($1, $2, $3)`,
                    [TEST_COMPANY_CODE, TEST_COMPANY_NAME, "blah blah blah"])
    
    const resp = await request(app).put(`/companies/${TEST_COMPANY_CODE}`).send({
      name,
      description
    })

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      company: {
        code: TEST_COMPANY_CODE,
        name,
        description
      }
    })

  })


  test("DELETE /companies", async function(){
    
    await db.query(`INSERT INTO companies 
                    (code, name, description) 
                    VALUES ($1, $2, $3)`,
                    [TEST_COMPANY_CODE, TEST_COMPANY_NAME, "blah blah blah"])

    const resp = await request(app).delete(`/companies/${TEST_COMPANY_CODE}`)

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      status: "deleted"
    })
  })

  // invoices
  test("GET /invoices", async function(){

    const resp = await request(app).get('/invoices');

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      "invoices": [
        {
          "id": 1,
          "comp_code": "apple",
          "amt": 100,
          "paid": false,
          "add_date": "2022-10-05T07:00:00.000Z",
          "paid_date": null
        },
        {
          "id": 2,
          "comp_code": "apple",
          "amt": 200,
          "paid": false,
          "add_date": "2022-10-05T07:00:00.000Z",
          "paid_date": null
        },
        {
        "id": 3,
        "comp_code": "apple",
        "amt": 300,
        "paid": true,
        "add_date": "2022-10-05T07:00:00.000Z",
        "paid_date": "2018-01-01T08:00:00.000Z"
        },
        {
          "id": 4,
          "comp_code": "ibm",
          "amt": 400,
          "paid": false,
          "add_date": "2022-10-05T07:00:00.000Z",
          "paid_date": null
        }
      ]
    })
  })


  test("GET /invoices/:id", async function(){
    const resp = await request(app).get(`/invoices/${1}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      "invoice": {
        "id": 1,
        "comp_code": "apple",
        "amt": 100,
        "paid": false,
        "add_date": "2022-10-05T07:00:00.000Z",
        "paid_date": null
      }
    })
  })


  test("POST /invoices", async function(){

    await db.query(`INSERT INTO companies 
                    (code, name, description) 
                    VALUES ($1, $2, $3)`,
                    [TEST_COMPANY_CODE, TEST_COMPANY_NAME, "blah blah blah"])

    const resp = await request(app).post('/invoices').send({
      comp_code: TEST_COMPANY_CODE,
      amt: 1000
    })

    expect(resp.statusCode).toBe(200);
    expect(resp.body.invoice.comp_code).toEqual(TEST_COMPANY_CODE);
    expect(resp.body.invoice.amt).toEqual(1000);
    expect(resp.body.invoice.paid).toEqual(false)

  })


  test("PUT /invoices/:id", async function(){

    await db.query(`INSERT INTO companies 
                    (code, name, description) 
                    VALUES ($1, $2, $3)`,
                    [TEST_COMPANY_CODE, TEST_COMPANY_NAME, "blah blah blah"]);

    let invIdQuery = await db.query(`INSERT INTO invoices
                    (comp_code, amt)
                    VALUES ($1, $2)
                    RETURNING id`,
                    [TEST_COMPANY_CODE, 1000]);
                    
    let invId = invIdQuery.rows[0].id;

    const resp = await request(app).put(`/invoices/${invId}`).send({
      amt: 2000,
      paid: true
    })

    expect(resp.statusCode).toBe(200);
    expect(resp.body.invoice.id).toEqual(invId)
    expect(resp.body.invoice.comp_code).toEqual(TEST_COMPANY_CODE)
    expect(resp.body.invoice.amt).toEqual(2000)
    expect(resp.body.invoice.paid).toEqual(true)
  })


  test("DELETE /invoices/:id", async function(){

    await db.query(`INSERT INTO companies 
                    (code, name, description) 
                    VALUES ($1, $2, $3)`,
                    [TEST_COMPANY_CODE, TEST_COMPANY_NAME, "blah blah blah"])

    let invIdQuery = await db.query(`INSERT INTO invoices
                    (comp_code, amt)
                    VALUES ($1, $2)
                    RETURNING id`,
                    [TEST_COMPANY_CODE, 1000]);
                    
    let invId = invIdQuery.rows[0].id;

    const resp = await request(app).delete(`/invoices/${invId}`)

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({status: "deleted"})
  })

  // industries
  test("GET /industries", async function(){
    const resp = await request(app).get('/industries');

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      "industries": [
        {
          "code": "comp",
          "industry": "Computers",
          "companies": [
            "apple",
            "ibm"
          ]
        },
        {
          "code": "sftwr",
          "industry": "Software",
          "companies": [
            "apple"
          ]
        }
      ]
    })
  })


  test("POST /industries", async function(){

    const resp = await request(app).post('/industries').send({
      code: TEST_INDUSTRY_CODE,
      industry: TEST_INDUSTRY_NAME
    })

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      industry: {
        code: TEST_INDUSTRY_CODE,
        industry: TEST_INDUSTRY_NAME
      }
    })

  })


  test("POST /industries/assign-company/:industry_code", async function(){

    await db.query(`INSERT INTO companies 
                    (code, name, description) 
                    VALUES ($1, $2, $3)`,
                    [TEST_COMPANY_CODE, TEST_COMPANY_NAME, "blah blah blah"])

    await db.query(`INSERT INTO industries
                    (code, industry)
                    VALUES ($1, $2)`,
                    [TEST_INDUSTRY_CODE, TEST_INDUSTRY_NAME])

    const resp = await request(app).post(`/industries/assign-company/${TEST_INDUSTRY_CODE}`).send({
      company_code: TEST_COMPANY_CODE
    })

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      company_industry: {
        company_code: TEST_COMPANY_CODE,
        industry_code: TEST_INDUSTRY_CODE
      }
    })
  })

})