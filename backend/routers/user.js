const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const { SECRET_KEY } = require("../utils/constants");
const checkJWT = require("../middleware/check_jwt");

const User = require("../models").User;

router.post(
  "/register",
  body("email").isEmail(),
  body("password").isLength({ min: 4 }),
  async (req, res) => {
    const { name, email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    console.log(hashPassword);

    User.create({ name, email, password: hashPassword })
      .then((user) => {
        // JWTの発行
        const accessToken = JWT.sign({ email }, SECRET_KEY, {
          expiresIn: "1h",
        });
        const refreshToken = JWT.sign({ email }, SECRET_KEY, {
          expiresIn: "7d",
        });

        res.status(201).json({ accessToken, refreshToken });
      })
      .catch((error) => {
        res.status(500).send({ error: "データの追加に失敗しました。" });
      });
  }
);

// リフレッシュトークンで新しいアクセストークンを取得
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ error: "リフレッシュトークンが必要です" });

  // リフレッシュトークンの検証
  try {
    const payload = JWT.verify(refreshToken, SECRET_KEY);
    // アクセストークン更新
    const newAccessToken = JWT.sign({ email: payload.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    // リフレッシュトークン更新
    const newRefreshToken = JWT.sign({ email: payload.email }, SECRET_KEY, {
      expiresIn: "7d",
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(403).json({ error: "リフレッシュトークンが無効です" });
  }
});

router.get("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: "ユーザーが存在しません" });
  }
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ error: "パスワードが違います" });
  }
  // JWTの発行
  const accessToken = JWT.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
  const refreshToken = JWT.sign({ email }, SECRET_KEY, {
    expiresIn: "7d",
  });

  res.status(201).json({ accessToken, refreshToken });
});

router.get("/", (req, res) => {
  User.findAll()
    .then((users) => {
      res.send(users);
    })
    .catch((error) => {
      res.status(500).send({ error: "データの取得に失敗しました。" });
    });
});

router.get("/:id", (req, res) => {
  const id = req.params.id;
  User.findByPk(id)
    .then((user) => {
      res.json(user);
    })
    .catch((error) => {
      res.status(500).send({ error: "データの取得に失敗しました。" });
    });
});

router.put("/:id", (req, res) => {
  const id = req.params.id;
  const { name, email, password } = req.body;
  User.update({ name, email, password }, { where: { id } })
    .then((user) => {
      if (user[0] === 0) {
        return res
          .status(404)
          .send({ error: "指定されたIDのユーザーが見つかりません。" });
      }
      res.json({ message: "更新成功" });
    })
    .catch((error) => {
      if (error.name === "SequelizeValidationError") {
        return res.status(400).send({ error: "入力データが不正です。" });
      }
      res.status(500).send({ error: "データの更新に失敗しました。" });
    });
});

router.delete("/:id", checkJWT, (req, res) => {
  const id = req.params.id;
  User.findByPk(id)
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .send({ error: "指定されたIDのユーザーが見つかりません。" });
      }
      if (user.email !== req.user) {
        return res
          .status(403)
          .send({ error: "この操作は許可されていません。" });
      }
      User.destroy({ where: { id } })
        .then((deleted) => {
          if (deleted) {
            res.status(204).json({ message: "削除成功" });
          }
        })
        .catch((error) => {
          console.error("削除処理中にエラーが発生しました:", error);
          res
            .status(500)
            .send({ error: "サーバー内部でエラーが発生しました。" });
        });
    })
    .catch((error) => {
      console.error("ユーザー検索中にエラーが発生しました:", error);
      res.status(500).send({ error: "サーバー内部でエラーが発生しました。" });
    });
});

module.exports = router;