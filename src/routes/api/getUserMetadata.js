const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

/**
 * GET /v1/fragments/:id/info
 */
module.exports = async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error(err);
    return res.status(404).json(createErrorResponse(404, `${err}. Got ID ${req.params.id}`));
  }
};
