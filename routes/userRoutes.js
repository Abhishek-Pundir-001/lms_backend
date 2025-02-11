// import express from 'express'

import {Router} from 'express'
import { changePassword, forgotPassword, getProfile, login, logout, register, resetPassword, updateProfile } from '../controllers/userContoller.js';
import { isLoggedIn } from '../middleware/userAuthMiddleware.js';
import upload from '../middleware/multer.middleware.js';

const Routes = Router()

Routes.post('/register',upload.single("avatar"),register);
Routes.post('/login',login);
Routes.get('/logout',logout);
Routes.get('/me',isLoggedIn,getProfile);
Routes.post('/forgot-password',forgotPassword);
Routes.post('/reset-password',resetPassword);
Routes.post('/change-password',isLoggedIn,changePassword);
Routes.put('/update/:id',isLoggedIn,upload.single("avatar"),updateProfile);

export default Routes;
