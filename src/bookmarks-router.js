const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('./logger');
const BookmarksService = require('./bookmarks-service');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then((bookmarks) => {
        res.json(bookmarks);
      })
      .catch(next);
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
bookmarksRouter.route('/bookmarks/:id').get((req, res, next) => {
  const knexInstance = req.app.get('db');
  BookmarksService.getById(knexInstance, req.params.id)
    .then((article) => {
      if (!article) {
        return res.status(404).json({
          error: { message: `Bookmark Not Found` },
        });
      }
      res.json(article);
    })
    .catch(next);
});

module.exports = bookmarksRouter;
