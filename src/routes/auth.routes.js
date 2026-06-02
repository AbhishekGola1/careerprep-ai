const express = require('express');
const authController = require('../controllers/auth.controller');

const authRouter = express.Router();


/* @route POST /api/auth/register --> Resgister a new user */
authRouter.post('/register', authController.registerUserController);


/* @route POST /api/auth/login --> Login a user with email and password */
authRouter.post('/login', authController.loginUserController);


/* @route GET /api/auth/logout --> clear token from user cookie and add the token to blacklist */
authRouter.get('/logout', authController.logoutUserController);




module.exports = authRouter;