const { toTitleCase, validateEmail } = require("../config/function");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");
const jwt = require("jsonwebtoken");
const { RSA_PRIVATE_KEY, RSA_PUBLIC_KEY } = require("../config/keys");

class Auth {
  /* restituisce il ruolo dell’utente loggato (usata dal frontend) */
  async isAdmin(req, res) {
    try {
      const { loggedInUserId } = req.body;
      const user = await userModel.findById(loggedInUserId);
      return res.json({ role: user.userRole });
    } catch {
      return res.status(404).end();
    }
  }

  async allUser(req, res) {
    try {
      const users = await userModel.find({});
      return res.json({ users });
    } catch {
      return res.status(404).end();
    }
  }

  /* --------------------- SIGN-UP (role 1 = admin) -------------------- */
  async postSignup(req, res) {
    let { name, email, password, cPassword } = req.body;
    const errObj = {};

    if (!name || !email || !password || !cPassword) {
      return res.json({
        error: { name: 'Campo obbligatorio', email: 'Campo obbligatorio',
                 password: 'Campo obbligatorio', cPassword: 'Campo obbligatorio' },
      });
    }
    try {
      const data = await userModel.findOne({ email: email });
      if (!data) {
        return res.json({
          error: "Invalid email or password",
        });
      } else {
        const login = await bcrypt.compare(password, data.password);
        if (login) {
            const token = jwt.sign(
            { _id: data._id, role: data.userRole },
            RSA_PRIVATE_KEY,
            {
              algorithm: "RS256",
              expiresIn: "1d",
              issuer: process.env.ISSUER_DOMAIN,
            }
            );
          const encode = jwt.verify(token, RSA_PUBLIC_KEY);
          return res.json({
            token: token,
            user: encode,
          });
        } else {
          return res.json({
            error: "Invalid email or password",
          });
        }
      }
    } catch (err) {
      console.log(err);
    }

    if (!validateEmail(email)) {
      return res.json({ error: { email: 'Email non valida' } });
    }

    if (password.length < 8 || password.length > 255) {
      return res.json({ error: { password: 'Password must be ≥ 8 caratteri' } });
    }

    /* verifica unicità email */
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ error: { email: 'Email già registrata' } });
    }

    /* creazione utente */
    const hashed = bcrypt.hashSync(password, 10);
    const newUser = new userModel({
      name  : toTitleCase(name),
      email,
      password : hashed,
      userRole : 0,           // admin per semplicità nella demo
    });

    await newUser.save();
    return res.json({ success: 'Account creato, effettua il login.' });
  }

  /* -------------------------- SIGN-IN --------------------------- */
  async postSignin(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ error: 'Fields must not be empty' });
    }

    const user = await userModel.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.json({ error: 'Invalid email or password' });
    }

    const token = await signToken({ _id: user._id, role: user.userRole });
    return res.json({ token, user: { _id: user._id, role: user.userRole } });
  }

  /* ---------------- JWKS endpoint (necessario al verifier) -------------- */
  jwks(req, res) {
    /* esponiamo il JWK ricavato dalla chiave pubblica → /.well-known/jwks.json */
    return res.json({ keys: [{ ...JWK, alg: 'RS256', use: 'sig' }] });
  }
}

module.exports = new Auth();
