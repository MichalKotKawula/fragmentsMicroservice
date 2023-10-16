// src/routes/api/get.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

/**
 * Get a list of fragments belonging to the current user.
 * Can be an array of fragment IDs, an array of fragment metadata, or error
 */
module.exports = async (req, res) => {
  try {
    let data;

    if (req.originalUrl === '/v1/fragments') {
      data = { fragments: await Fragment.byUser(req.user) };
      return res.status(200).json(createSuccessResponse(data));
    } else if (req.originalUrl === '/v1/fragments?expand=1') {
      data = { fragments: await Fragment.byUser(req.user, true) };
      return res.status(200).json(createSuccessResponse(data));
    }
    return res.status(404).json(createErrorResponse(404, `Invalid URL`));
  } catch (err) {
    logger.error(err);
    return err;
  }
};
