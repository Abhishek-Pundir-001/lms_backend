import userModel from "../models/userSchema.js";

import { validate } from 'email-validator'
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import sendEmail from "../utils/sendEmail.js";
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
}

const register = async (req, res, next) => {
    const { name, email, password, role } = req.body;
    // const {file} = req.file
    // console.log(file)
    // console.log(name,email,password);

    if (!name || !email || !password) {
        return next(new AppError('All fields are mandatory,', 500))

    }

    const validEmail = await validate(email)

    if (!validEmail) {
        return next(new AppError('Invalid email'))

    }

    const userExist = await userModel.findOne({ email });
    if (userExist) {
        return next(new AppError('email already exist', 500))

    }

    const user = await userModel.create({
        name,
        email,
        password,
        role,
        avatar: {
            public_id: email,
            secure_url: ""
        }
    })

    if (!user) {
        return next(new AppError('user registration failed', 500))

    }

    if (req.file) {
        // console.log('exist', req.file.path)
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill'
            }
            );

            if (result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;
                (await user.save())
            }


            //  Remove file from server

            fs.rm(`uploads/${req.file.filename}`)

        } catch (e) {
            return next(new AppError(e.message || 'file cannot be uploaded', 500))
        }
    }



    user.password = undefined

    const token = await user.generateJWTToken();

    if (!token) {
        return next(new AppError('something went wrong', 500))
    }

    res.cookie('token', token, cookieOptions)

    res.status(200).json({
        success: true,
        message: 'user registered successfully',
        data: user
    })

}

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) {
            return next(new AppError('All field are mandatory', 500))
        }

        const user = await userModel.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return next(new AppError(('invalid credentials', 500)))
        }
        user.password = undefined

        const token = await user.generateJWTToken();

        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            success: true,
            message: 'login successfully',
            data: user
        })
    } catch (e) {
        return res.status(400).json({
            success: false,
            message: e.message
        })

    }
}


const logout = (req, res, next) => {
    res.cookie('token', null, {
        httpOnly: true,
        secure: true,
        maxAge: 0
    })
    res.status(200).json({
        success: true,
        message: 'user logged out successfully'
    })
}

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);

        return res.status(200).json({
            success: true,
            message: 'user details',
            data: user
        })
    } catch (e) {
        return res.status(200).json({
            success: false,
            message: next(new AppError(e.message, 500))
        })

    }

}

const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new AppError('please enter valid email id', 400))
    }

    const user = await userModel.findOne({ email });
    // console.log(user)
    if (!user) {
        return next(new AppError('email id not registered', 400))
    }

    const resetToken = await user.generateResetPasswordToken()
    // console.log('token',resetToken)

    await user.save()

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

    const subject = "Reset password";
    const message = `please click on the link to reset your password <a href=${resetPasswordUrl} target='_blank'>${resetPasswordUrl}</a>`

    try {
        await sendEmail(email, subject, message)
        return res.status(200).json({
            success: true,
            message: `mail for password reset send successfully at ${email}`
        })
    } catch (e) {
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;
        await user.save()

        return next(new AppError(e.message, 500))

    }


}

const resetPassword = async (req, res, next) => {
    const { resetToken } = req.params;

    const { password } = req.body

    if (!token || !password) {
        return next(new AppError('something went wrong', 400))
    }

    const forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    const user = await userModel.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    })

    if (!user) {
        return next(new AppError('something went wrong please try again', 500))
    }

    user.password = password

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    user.save()
}

const changePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    const { id } = req.params;

    if (!oldPassword || !newPassword) {
        return next(new AppError('All fields are mandatory', 400))
    }

    const user = await userModel.findById({ id }).select('+password');
    if (!user) {
        return next(new AppError('user does not exist', 400))
    }

    const isPassworValid = bcrypt.compare(oldPassword, user.password);
    if (!isPassworValid) {
        return next(new AppError('invalid old password', 500))
    }
    user.password = newPassword;
    user.save()

    user.password = undefined;
    return res.status(200).json({
        success: true,
        message: "password changed successfully"
    })

}

const updateProfile = async (req, res, next) => {
    const { fullName } = req.body;
    const { id } = req.params;


    const user = await userModel.findById(id)

    if (!user) {
        return next(new AppError('user does not exist', 500))
    }


    user.name = fullName;

    if (req.file) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id)
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill'
            });
            if (result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;
                (await user.save());
            }

            //  Remove file from server

            fs.rm(`uploads/${req.file.filename}`)

        } catch (e) {
            return next(new AppError(e.message || 'file cannot be uploaded', 500))
        }
    }

    return res.status(200).json({
        success: true,
        message: 'successfully updated'
    })
}




export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile
}