require("dotenv").config();
const express = require("express");
const cors = require("cors");

const userRouter = require("./routers/user");
const postRouter = require("./routers/post");

const app = express();
const port = 3000;

// corsを使うと、クロスオリジンのエラーが出なくなる
app.use(cors());
// ExpressでJSONボディを扱えるようにする
app.use(express.json());

app.use("/users", userRouter);
app.use("/posts", postRouter);

app.get("/", (req, res) => {
  res.json({ message: "Success API Server" });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
