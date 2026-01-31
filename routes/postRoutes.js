const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");

router.get("/home", postController.getHome);

router.get("/trending", postController.getTrending);


module.exports = router;

