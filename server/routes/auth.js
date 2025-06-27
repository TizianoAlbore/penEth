// routes/auth.js
const express = require('express');
const router  = express.Router();
const authController = require('../controller/auth');
const { loginCheck, isAuth, isAdmin } = require('../middleware/auth');

/* JWKS route per la chiave pubblica */
router.get('/.well-known/jwks.json', authController.jwks);

/* routes “storici” invariati */
router.post('/isadmin', authController.isAdmin);
router.post('/signup',  authController.postSignup);
router.post('/signin',  authController.postSignin);
router.post('/user', loginCheck, isAuth, isAdmin, authController.allUser);

module.exports = router;
