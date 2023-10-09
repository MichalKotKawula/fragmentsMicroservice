const { Fragment } = require('../../model/fragment');
const { URL } = require('url');
const logger = require('../../logger');

// const contentType = require('content-type');

module.exports = async (req, res) => {
  try {
    logger.info('Received a POST fragment request');
    // Check if req.body is a buffer
    // eslint-disable-next-line no-undef
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).send('Invalid request. Expected raw binary data in the request body.');
    }

    // Extract content type and check if it's supported
    const type = req.headers['content-type'];
    logger.debug(`Received content type: ${type}`);
    if (!Fragment.isSupportedType(type)) {
      // Ensure support for text/plain fragments
      if (type === 'text/plain') {
        logger.info('Received a text/plain content type. Handling it separately.');
        // Handle saving text/plain fragments
      } else {
        logger.warn(`Unsupported media type: ${type}`);
        return res.status(415).send('Unsupported media type.');
      }
    }

    // You can retrieve the ownerId from the authenticated user.
    // For the purpose of this example, let's assume ownerId is set from some authentication middleware.
    const ownerId = req.user ? req.user.id : null;

    // Check for ownerId validity
    if (!ownerId) {
      return res.status(401).send('Unauthorized.');
    }

    // Create a new fragment
    const fragment = new Fragment({
      ownerId: ownerId,
      type: type,
    });

    // Set and save data for the fragment
    await fragment.setData(req.body);

    // eslint-disable-next-line no-undef
    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const fragmentUrl = new URL(`/fragments/${fragment.id}`, baseUrl);
    logger.debug(`Setting response header location: ${fragmentUrl.toString()}`);

    res.setHeader('Location', fragmentUrl.toString());

    // Send a successful response with the fragment details
    res.status(201).json({
      id: fragment.id,
      ownerId: fragment.ownerId,
      created: fragment.created,
      updated: fragment.updated,
      type: fragment.type,
      size: fragment.size,
    });
  } catch (err) {
    // Handle errors
    res.status(500).send(`Error: ${err.message}`);
  }
};
