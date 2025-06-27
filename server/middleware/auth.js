const jwt = require("jsonwebtoken");
const { RSA_PUBLIC_KEY } = require("../config/keys");
const userModel = require("../models/users");

exports.loginCheck = (req, res, next) => {
  try {
    let token = req.headers.token || req.headers.authorization;
    console.log("Token from headers:", token);
    if (!token) {
      throw new Error("Missing token");
    }
    token = token.replace("Bearer ", "");
    console.log("Token after removing 'Bearer':", token);
    const decode = jwt.verify(token, RSA_PUBLIC_KEY, {
      algorithms: ["RS256","HS256"]});
    console.log("Decoded token:", decode);
    req.userDetails = decode;
    next();
  } catch (err) {
    console.log("Error during token verification:", err.message);
    res.json({
      error: "You must be logged in",
    });
  }
};

exports.isAuth = (req, res, next) => {
  let { loggedInUserId } = req.body;
  if (
    !loggedInUserId ||
    !req.userDetails._id ||
    loggedInUserId != req.userDetails._id
  ) {
    res.status(403).json({ error: "You are not authenticate" });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  try {
    const payload = req.userDetails || (() => {
      let t = req.headers.token || req.headers.authorization;
      if (!t) throw new Error("Missing token");
      t = t.replace("Bearer ", "");
      return jwt.verify(t, RSA_PUBLIC_KEY);
    })();

    if (payload.role !== 1) {
      return res.status(403).json({ error: "Access denied - admin only" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
