// eslint-disable-next-line no-undef
module.exports = process.env.AWS_REGION ? require('./aws') : require('./memory');
