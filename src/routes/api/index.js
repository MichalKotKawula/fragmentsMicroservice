// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const contentType = require('content-type');
const logger = require('../../logger');
//Assignment 1
const { Fragment } = require('../../model/fragment');
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type. If we can, `req.body` will be
      // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
      // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      try {
        const { type } = contentType.parse(req);
        return Fragment.isSupportedType(type);
      } catch (err) {
        logger.error(err);
      }
    },
  });
// End of Assignment 1 modification

// Create a router on which to mount our API endpoints
const router = express.Router();

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', require('./get'));

// Other routes will go here later on...
router.post('/fragments', rawBody(), require('./post'));

// Get fragments by id
router.get('/fragments/:id', require('./getById'));

// GET /fragments/:id/info
router.get('/fragments/:id/info', require('./getUserMetadata'));

// DELETE /fragments/:id
router.delete('/fragments/:id', require('./delete'));

// PUT /fragments/:id
router.put('/fragments/:id', rawBody(), require('./put'));

module.exports = router;
