const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');

module.exports = async (req, res) => {
  try {
    // Generate an error response if
    // content-type is invalid (req.body is not a buffer)
    // eslint-disable-next-line no-undef
    if (!Buffer.isBuffer(req.body)) {
      return res.status(415).json(createErrorResponse(415, 'UNSUPPORTED_CONTENT_TYPE'));
    }

    // Empty fragments are not allowed
    if (!req.body.toString().replace(/\s/g, '').length) {
      return res.status(400).json(createErrorResponse(400, 'EMPTY_DATA'));
    }

    // getting the content type (specified by the client)
    const type = contentType.parse(req);
    logger.debug(`[post.js] parsed type: ${JSON.stringify(type, null, 4)}}`);

    // Create a new fragment object, making sure to include the character set as well (if it was specified during creation)
    let fragment = new Fragment({
      ownerId: req.user,
      // eslint-disable-next-line no-undef
      size: Buffer.byteLength(req.body),
      type: type.parameters.charset
        ? type.type + '; charset=' + type.parameters.charset
        : type.type,
    });

    // Attempt to save fragment to the db
    await fragment.setData(req.body);
    await fragment.save();

    res
      .setHeader(
        'Location',
        `${
          req.protocol +
          `://` +
          // eslint-disable-next-line no-undef
          (process.env.API_URL == 'localhost:8080' ? process.env.API_URL : req.headers.host)
        }/v1/fragments/${fragment.id}`
      )
      .setHeader('Access-Control-Expose-Headers', 'Location')
      .status(201)
      .json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error(err);
    throw new Error('Error saving fragment. ', err);
  }
};
