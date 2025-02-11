import { Schema, model } from 'mongoose'
import jwt from 'jsonwebtoken'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
        minLength: [5, 'Name must include at leat 5 character'],
        maxLength: [50, 'Name can contain maximum 50 character'],
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        select: false,
        minLength: [6, 'password must contain at leat 8 char']
    },
    avatar: {
        public_id: {
            type: String,

        },
        secure_url: {
            type: String
        }
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date

}, { timestamps: true })

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next
    }
    this.password = await bcrypt.hash(this.password,10) 
})

userSchema.methods = {
    generateJWTToken: async function() {
        return await jwt.sign(
            {id:this._id,email:this.email,subscription:this.subscription,role:this.role},
            process.env.SECRET,
            {expiresIn:'24h'} 
        )
    },
    generateResetPasswordToken: async function () {
        const resetToken = crypto.randomBytes(20).toString('hex')

        this.forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
        this.forgotPasswordExpiry = Date.now() + 10 * 60 * 1000;

        return resetToken

    }
}

const userModel = model('users', userSchema);
export default userModel