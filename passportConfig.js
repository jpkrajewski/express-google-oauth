import { Strategy } from "passport-local";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import { query } from "./db.js"

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL || !process.env.GOOGLE_USER_PROFILE_URL) {
  throw Error("Required environment variables are missing.");
}

passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await query("SELECT * FROM users WHERE email = $1 ", [username]);
        if (result.rowCount === 0) {
            return cb(null, false, {message: "User not found"});
        }
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        try {
            const valid = bcrypt.compare(password, storedHashedPassword);
            if (valid) return cb(null, user);
            return cb(null, false);
        } catch (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
        }
    } catch (err) {
        return cb(err);
    }
}));
  
passport.use("google", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    userProfileURL: process.env.GOOGLE_USER_PROFILE_URL,
    passReqToCallback: true,
  }, async (request, accessToken, refreshToken, profile, done) => {
    console.log(profile);
    try {
    const result = await query("SELECT * FROM users WHERE email = $1", [profile.email]);
    if (result.rowCount === 0) {
      const newUser = await query("INSERT INTO users (email, password) VALUES ($1, $2)", [profile.email, "google"]);
      done(null, newUser.rows[0]);
    } else {
      done(null, result.rows[0]);
    } } catch (err) {
      done(err);
    }
  }));

export default passport;