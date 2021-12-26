const express = require("express");
const router = express.Router();
// const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const Post = require("../models/post");
const config = require("config");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");

// @route POST /api/posts
// @desc Add Post
// @access Private
router.post(
  "/",
  [auth, [check("body", "Enter some text inside post body").not().isEmpty()]],
  async (req, res) => {
    // Validate Data inside request body
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const post = new Post({
      user: req.user.id,
      body: req.body.body,
    });

    try {
      await post.save();
      res.status(200).json({ post });
    } catch (err) {
      console.log("Error ", err.message);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

// @route GET /api/posts
// @desc Get all posts
// @access Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json({ posts });
  } catch (err) {
    console.log("Error ", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// @route GET /api/posts/:userID
// @desc Get user's posts
// @access Private
router.get("/:userID", auth, async (req, res) => {
  try {
    if (req.params.userID !== req.user.id)
      return res.status(401).json({ msg: "User not authorized" });
    const posts = await Post.find({ user: req.params.userID });
    res.status(200).json({ posts });
  } catch (err) {
    console.log("Error ", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// @route PUT /api/posts/:postID
// @desc Update Post
// @access Private
router.put(
  "/:id",
  [
    auth,
    [check("body", "Enter some text inside body of post").not().isEmpty()],
  ],
  async (req, res) => {
    // Validate Data inside request body
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const changes = {};

    if (req.body.body) changes.body = req.body.body;

    try {
      let post = await Post.findById(req.params.id);
      if (!post)
        return res
          .status(400)
          .json({ msg: "Post with this ID does not exist" });

      if (post.user.toString() !== req.user.id)
        return res
          .status(401)
          .json({ msg: "This user is not authorized to update this post" });

      post = await Post.findByIdAndUpdate(
        req.params.id,
        { $set: changes },
        { new: true }
      );

      res.status(200).json({ post });
    } catch (err) {
      console.log("Error ", err.message);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

// @route DELETE /api/posts/:postID
// @desc Delete Post
// @access Private
router.delete("/:id", auth, async (req, res) => {
  // Validate Data inside request body
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    let post = await Post.findById(req.params.id);
    if (!post)
      return res.status(400).json({ msg: "Post with this ID does not exist" });

    if (post.user.toString() !== req.user.id)
      return res
        .status(401)
        .json({ msg: "This user is not authorized to delete this post" });

    await Post.findByIdAndRemove(req.params.id);

    res.status(200).json({ msg: "The Post has been deleted" });
  } catch (err) {
    console.log("Error ", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
