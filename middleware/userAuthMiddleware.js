import AppError from "../utils/error.util.js"
import jwt from 'jsonwebtoken'


const isLoggedIn = async (req, res, next) => {

    try {
        const token = req.cookies && req.cookies.token
        if (!token) {
            
            return next(new AppError('Not authorized', 401))
        }

        const payload = await jwt.verify(token, process.env.SECRET)

        req.user = { id: payload.id, role: payload.role }
    } catch (e) {
        return res.status(400).json({
            success: false,
            message: next(new AppError(e.message, 400))
        })
    }

    next()
}

const authorizeRole = (...roles) => async (req, res, next) => {
    const currentRoles = req.user.role
    if (!roles.includes(currentRoles)) {
        return next(new AppError('Not authorizes to accesss this route', 400))
    }
    next()
}

export {
    isLoggedIn,
    authorizeRole
}

