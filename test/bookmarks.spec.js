const knex = require('knex');
const { DB_URL, API_TOKEN } = require('../src/config');
const fixtures = require('./bookmarks-fixtures');
const app = require('../src/app');
const store = require('../src/store');

describe('Bookmarks Endpoints', () => {
  let bookmarksCopy, db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  beforeEach('copy the bookmarks', () => {
    bookmarksCopy = store.bookmarks.slice();
  });

  afterEach('restore the bookmarks', () => {
    store.bookmarks = bookmarksCopy;
  });

  describe(`Unauthorized requests`, () => {
    it(`responds with 401 Unauthorized for GET /bookmarks`, () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds with 401 Unauthorized for POST /bookmarks`, () => {
      return supertest(app)
        .post('/bookmarks')
        .send({ title: 'test-title', url: 'http://some.thing.com', rating: 1 })
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds with 401 Unauthorized for GET /bookmarks/:id`, () => {
      const secondBookmark = store.bookmarks[1];
      return supertest(app)
        .get(`/bookmarks/${secondBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds with 401 Unauthorized for DELETE /bookmarks/:id`, () => {
      const aBookmark = store.bookmarks[1];
      return supertest(app)
        .delete(`/bookmarks/${aBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });
  });

  describe('GET /bookmarks', () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(200, []);
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('gets the bookmarks from the store', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(200, testBookmarks);
      });
    });
  });

  describe('GET /bookmarks/:id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 whe bookmark doesn't exist`, () => {
        return supertest(app)
          .get(`/bookmarks/123`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not Found` },
          });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });
  });
});
