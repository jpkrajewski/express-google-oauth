import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import env from "dotenv";
import { query } from "./db.js";
import passport from "./passportConfig.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

env.config();

if (!process.env.SESSION_SECRET) {
  throw Error("Required environment variables are missing.");
}


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/secrets", async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const result = await query("SELECT secret FROM users WHERE email = $1", [req.user.email]);
      res.render("secrets.ejs", { secret: result.rows[0].secret });
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.error("Error retrieving secrets:", err);
    res.status(500).send("Error retrieving secrets");
  }
});


app.post("/submit", async (req, res) => {
  if (req.isAuthenticated()) {
    const newSecret = req.body.secret;
    try {
     await query("UPDATE users SET secret = $1 WHERE email = $2", [newSecret, req.user.email]);
     res.redirect("/secrets");
    } catch (err) {
      console.error("Error updating secret:", err);
      res.status(500).send("Error updating secret");
    }
  } else {
    res.redirect("/login");
  }
})

app.get("/submit", async (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});



passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
