const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const hash = require('../../src/hash');

const fragment1 = new Fragment({ ownerId: hash('user1@email.com'), type: 'text/plain', size: 0 });

describe('DELETE /v1/fragments/:id', () => {
  test('deleting a fragment removes its data and metadata', async () => {
    await fragment1.save();
    // eslint-disable-next-line no-undef
    await fragment1.setData(Buffer.from('This is a fragment'));

    let res = await request(app)
      .delete(`/v1/fragments/${fragment1.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);

    // Attempt to retrieve the now-deleted fragment's data
    res = await request(app)
      .get(`/v1/fragments/${fragment1.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);

    res = await request(app)
      .get(`/v1/fragments/${fragment1.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });

  test('unknown id generates 404 error', async () => {
    await fragment1.save();
    // eslint-disable-next-line no-undef
    await fragment1.setData(Buffer.from('Hello'));

    const res = await request(app).delete(`/v1/fragments/123`).auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });
});
