const JWT = require("jsonwebtoken");
const { SECRET_KEY } = require("../utils/constants");

module.exports = async (req, res, next) => {
  // JWTを持っているか確認 (リクエストヘッダのx-auth-tokenを確認)
  const token = req.header("x-auth-token");

  if (!token) {
    res.status(400).json({
      message: "JWTがありません",
    });
  } else {
    try {
      let user = await JWT.verify(token, SECRET_KEY);
      console.log(user);
      req.user = user.email;

      next();
    } catch {
      return res.status(400).json({
        message: "JWTが不正です",
      });
    }
  }
};
