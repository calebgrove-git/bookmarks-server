const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('./logger');
const store = require('./STORE');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
  .route('/bookmarks')
  .get((req, res) => {
    res.json(store);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;
    const bookmark = { id: uuid(), title, url, description, rating };
    for (const required of ['title', 'url', 'rating']) {
      if (!req.body[required]) {
        logger.error(`${required} is required`);
        return res.status(400).send(`'${required}' is required`);
      }
    }
    if (typeof rating != 'number' || rating < 0 || rating > 5) {
      logger.error(`Invalid rating`);
      return res.status(400).send(`rating must be a number between 0 and 5`);
    }
    store.bookmarks.push(bookmark);
    logger.info(`Bookmark with id ${bookmark.id} created`);
    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
      .json(bookmark);
  });
bookmarksRouter
  .route('/bookmarks/:bookmark_id')
  .get((req, res) => {
    const { bookmarkId } = req.params;

    const bookmark = store.bookmarks.find((i) => i.id == bookmarkId);

    if (!bookmark) {
      logger.error(`Bookmark with id ${bookmarkId} not found.`);
      return res.status(404).send('Bookmark Not Found');
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { bookmarkId } = req.params;

    const bookmarkIndex = store.bookmarks.findIndex((i) => i.id === bookmarkId);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${bookmark_id} not found.`);
      return res.status(404).send('Bookmark Not Found');
    }

    store.bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${bookmark_id} deleted.`);
    res.status(204).end();
  });

module.exports = bookmarksRouter;
