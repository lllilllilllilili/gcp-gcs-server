const express = require("express");
const cors = require("cors");
const router = express.Router();
const controller = require("../controller/file.controller");

let routes = (app) => {
  router.post("/upload", cors(), controller.upload);
  router.get("/files", cors(), controller.getListFiles);
  router.get("/files/:name", cors(), controller.download);

  app.use(router);
};

module.exports = routes;
