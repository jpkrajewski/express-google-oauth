import bcrypt from "bcrypt";
import express from "express";
import passport from "../passportConfig.js";
import { query } from "../db.js";

const router = express.Router();
const saltRounds = 10;


router.post(
    "/login",
    async (req, res, next) => {
      try {
        passport.authenticate("local", {
          successRedirect: "/secrets",
          failureRedirect: "/login",
        })(req, res, next);
      } catch (error) {
        console.error("Error in login route:", error);
        res.status(500).send("Login error");
      }
    }
  );
  
  
router.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login", successRedirect: "/secrets" }));
  
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  
router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        const checkResult = await query("SELECT * FROM users WHERE email = $1", [email]);
        if (checkResult.rows.length > 0) {
            return req.redirect("/login");
        } 
        const hash = await bcrypt.hash(password, saltRounds);
        const result = await query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", [email, hash]);    
        req.login(result.rows[0], (err) => {
            console.log("success");
            res.redirect("/secrets");
        });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).send("Internal Server Error");
    }
});

export default router;