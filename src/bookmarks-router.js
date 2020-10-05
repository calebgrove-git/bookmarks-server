const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('./logger');
const BookmarksService = require('./bookmarks-service');
const { isWebUri } = require('valid-url');
const xss = require('xss');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const serializeBookmark = (bookmark) => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: xss(bookmark.url),
  rating: bookmark.rating,
  description: xss(bookmark.description),
});
bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then((bookmarks) => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmark = { id: uuid(), title, url, description, rating };
    for (const required of ['title', 'url', 'rating']) {
      if (!req.body[required]) {
        logger.error(`${required} is required`);
        return res
          .status(400)
          .json({ error: { message: `'${required}' is required` } });
      }
    }
    if (typeof rating != 'number' || rating < 0 || rating > 5) {
      logger.error(`Invalid rating`);
      return res.status(400).json({
        error: { message: `rating must be a number between 0 and 5` },
      });
    }
    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`);
      return res.status(400).send({
        error: { message: `'url' must be a valid URL` },
      });
    }
    const newBookmark = { title, url, description, rating };
    logger.info(`Bookmark with id ${bookmark.id} created`);
    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then((bookmark) => {
        logger.info(`Bookmark with id ${bookmark.id} created.`);
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark));
      })
      .catch(next);
  });
bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getById(knexInstance, req.params.id)
      .then((bookmark) => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark Not Found` },
          });
        }
        res.json(serializeBookmark(bookmark));
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    const { id } = req.params;
    BookmarksService.deleteBookmark(req.app.get('db'), id)
      .then((bookmark) => {
        res.bookmark = bookmark;
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res.status(404).json({
            error: { message: `Bookmark Not Found` },
          });
        }
        logger.info(`Bookmark with id ${id} deleted.`);
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;
