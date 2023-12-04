// src/routes/api/delete.js
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

/**
 * DELETE /v1/fragments/:id
 * Delete a fragment (data and metadata), given its ID
 */
module.exports = async (req, res) => {
  try {
    await Fragment.byId(req.user, req.params.id);
    await Fragment.delete(req.user, req.params.id);
    return res.status(200).json(createSuccessResponse());
  } catch (err) {
    logger.error(err);
    return res.status(404).json(createErrorResponse(404, err.message));
  }
};
