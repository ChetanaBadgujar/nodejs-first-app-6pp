import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

const app = express();

// Using Middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Setting up View Engine
app.set("view engine", "ejs");

const isAuth = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decodedData = jwt.verify(token, "aaaaaaaaaaaaaaaaaaaaaaaa");
    req.user = await User.findById(decodedData._id);
    next();
  } else {
    res.redirect("/login");
  }
};
app.get("/", isAuth, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.name });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.redirect("/register");
  const isMatch = await bcrypt.compare(password,user.password);
  if (!isMatch) return res.render("login", { email, message: "Incorrect Password" });

  const token = jwt.sign(
    {
      _id: user._id,
    },
    "aaaaaaaaaaaaaaaaaaaaaaaa"
  );
  console.log(token);
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});



app.get("/register", (req, res) => {
  console.log(req.user);
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashPassword= await bcrypt.hash(password,10)
  const userId = await User.create({
    name,
    email,
    password:hashPassword,
  });

  const token = jwt.sign(
    {
      _id: userId._id,
    },
    "aaaaaaaaaaaaaaaaaaaaaaaa"
  );
  console.log(token);
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});


app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(5000, () => {
  console.log("Server is working");
});
