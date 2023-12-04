// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

const md = require('markdown-it')();
// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) {
      throw new Error('ownerId is required.');
    }
    if (!type || !Fragment.isSupportedType(type)) {
      throw new Error('Invalid or unsupported type.');
    }
    if (typeof size !== 'number' || size < 0) {
      throw new Error('Invalid size.');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId);
    if (expand) {
      return Promise.all(fragments.map((id) => Fragment.byId(ownerId, id)));
    }
    return fragments;
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    let fragment = await readFragment(ownerId, id);
    if (!(await readFragment(ownerId, id))) {
      throw new Error(`fragment does not exist for this user`);
    }
    if (!(fragment instanceof Fragment)) {
      // Convert to a Fragment object first if retrieving fragment data & metadata from the DB
      // otherwise, we can't use its methods
      let fragment2 = new Fragment({
        ownerId: fragment.ownerId,
        id: fragment.id,
        type: fragment.type,
        size: fragment.size,
      });
      // Set these two properties separately since their values are already date strings
      fragment2.created = fragment.created;
      fragment2.updated = fragment.updated;
      return fragment2;
    }
    return fragment;
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    await deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    // eslint-disable-next-line no-undef
    if (!(data instanceof Buffer)) throw new Error('Data should be a Buffer');

    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    const { type } = contentType.parse(this.type);
    return type.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    const { type } = contentType.parse(this.type);
    switch (type) {
      case 'text/plain':
        return ['text/plain'];
      case 'text/markdown':
        return ['text/markdown', 'text/html', 'text/plain'];
      case 'text/html':
        return ['text/html', 'text/plain'];
      case 'application/json':
        return ['application/json', 'text/plain'];
      default:
        return [];
    }
  }

  async convertData(convertTo) {
    // To convert the fragment's data,

    if (Fragment.isSupportedType(convertTo) && this.formats.includes(convertTo)) {
      const { type } = contentType.parse(this.type);
      const data = await this.getData();

      if (type === 'text/markdown' && convertTo === 'text/html') {
        return md.render(data.toString());
      }
      // An extension can be the fragment's current type OR the extension is .txt --> return the unmodified data
      // Converting to plain text does not require further modification
      return data;
    }
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */

  static isSupportedType(type) {
    const validTypes = ['text/markdown', 'text/html', 'text/plain', 'application/json'];
    const parsedType = contentType.parse(type).type;
    return validTypes.includes(parsedType);
  }
}

module.exports.Fragment = Fragment;
