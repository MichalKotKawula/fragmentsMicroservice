const httpMocks = require('node-mocks-http');
const { Fragment } = require('../../src/model/fragment');
const post = require('../../src/routes/api/post');

jest.mock('../../src/model/fragment');

describe('POST fragment', () => {
  it('should reject an invalid request body', async () => {
    const req = httpMocks.createRequest({ body: 'Invalid' });
    const res = httpMocks.createResponse();
    await post(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('should reject unsupported media types', async () => {
    Fragment.isSupportedType.mockReturnValue(false);
    const req = httpMocks.createRequest({
      // eslint-disable-next-line no-undef
      body: Buffer.from('test'),
      headers: { 'content-type': 'invalid/type' },
    });
    const res = httpMocks.createResponse();
    await post(req, res);

    expect(res.statusCode).toBe(415);
  });

  it('should reject unauthenticated requests', async () => {
    const req = httpMocks.createRequest({
      // eslint-disable-next-line no-undef
      body: Buffer.from('test'),
      headers: { 'content-type': 'valid/type' },
    });
    const res = httpMocks.createResponse();
    Fragment.isSupportedType.mockReturnValue(true);
    await post(req, res);

    expect(res.statusCode).toBe(401);
  });

  it('should create a plain text fragment for authenticated users', async () => {
    const req = httpMocks.createRequest({
      user: { id: '123' },
      // eslint-disable-next-line no-undef
      body: Buffer.from('test'),
      headers: { 'content-type': 'text/plain' },
    });
    const res = httpMocks.createResponse();
    const mockFragment = {
      id: 'fragmentId',
      ownerId: '123',
      created: Date.now(),
      updated: Date.now(),
      type: 'text/plain',
      size: 4,
      setData: jest.fn(),
    };
    Fragment.mockReturnValue(mockFragment);
    Fragment.isSupportedType.mockReturnValue(true);
    await post(req, res);

    // eslint-disable-next-line no-undef
    expect(mockFragment.setData).toHaveBeenCalledWith(Buffer.from('test'));
    expect(res.statusCode).toBe(201);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toMatchObject({
      id: 'fragmentId',
      ownerId: '123',
      type: 'text/plain',
      size: 4,
    });
  });

  let mockFragment;

  beforeEach(() => {
    mockFragment = {
      id: 'fragmentId',
      ownerId: '123',
      created: Date.now(),
      updated: Date.now(),
      type: 'text/plain',
      size: 4,
      setData: jest.fn(),
    };

    Fragment.mockReturnValue(mockFragment);
    Fragment.isSupportedType.mockReturnValue(true);
  });

  it('should set the Location header based on API_URL', async () => {
    // eslint-disable-next-line no-undef
    process.env.API_URL = 'http://api.example.com';

    const req = httpMocks.createRequest({
      user: { id: '123' },
      // eslint-disable-next-line no-undef
      body: Buffer.from('test'),
      headers: { 'content-type': 'text/plain' },
    });
    const res = httpMocks.createResponse();
    await post(req, res);

    expect(res.getHeader('Location')).toBe('http://api.example.com/fragments/fragmentId');
  });

  it('should fall back to request host if API_URL is not set', async () => {
    // eslint-disable-next-line no-undef
    delete process.env.API_URL;

    const req = httpMocks.createRequest({
      user: { id: '123' },
      // eslint-disable-next-line no-undef
      body: Buffer.from('test'),
      headers: { 'content-type': 'text/plain', host: 'localhost:8080' },
    });
    const res = httpMocks.createResponse();
    await post(req, res);

    expect(res.getHeader('Location')).toBe('http://localhost:8080/fragments/fragmentId');
  });
});
