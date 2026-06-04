const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const authRouter = express.Router();


/* @route POST /api/auth/register --> Resgister a new user               @access Public*/
authRouter.post('/register', authController.registerUserController);


/* @route POST /api/auth/login --> Login a user with email and password       @access Public*/
authRouter.post('/login', authController.loginUserController);


/* @route GET /api/auth/logout --> clear token from user cookie and add the token to blacklist      @access Public */
authRouter.get('/logout', authController.logoutUserController);


/* @route GET /api/auth/get-me --> Get the current logged in user details.    @access Private */
authRouter.get('/get-me', authMiddleware.authUser,  authController.getMeController);



module.exports = authRouter;