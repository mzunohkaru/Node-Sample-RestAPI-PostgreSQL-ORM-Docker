const router = require("express").Router();

const Post = require("../models").Post;
const checkJWT = require("../middleware/check_jwt");

router.post("/", (req, res) => {
  const { title, content, user_id } = req.body;
  Post.create({ title, content, user_id })
    .then((post) => {
      res.status(201).json(post);
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});

router.get("/", (req, res) => {
  Post.findAll()
    .then((posts) => {
      res.send(posts);
    })
    .catch((error) => {
      res.status(500).send({ error: "データの取得に失敗しました。" });
    });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: "投稿が見つかりません。" });
    }
    const user = await require("../models").User.findByPk(post.user_id);
    if (!user) {
      return res.status(404).json({ error: "ユーザーが見つかりません。" });
    }
    const result = { ...post.toJSON(), User: user };
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", checkJWT, (req, res) => {
  const { id } = req.params;
  Post.findByPk(id)
    .then((post) => {
      if (!post) {
        return res
          .status(404)
          .json({ error: "指定されたIDの投稿が見つかりません。" });
      }
      post.destroy();
      res.status(204).json({ message: "投稿が削除されました" });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});

module.exports = router;
