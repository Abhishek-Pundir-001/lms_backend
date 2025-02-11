import contactModel from "../models/contacSchema.js";
import AppError from "../utils/error.util.js";

const contactInfo = async (req, res, next) => {
    const { name, email, mobile, message } = req.body;
    console.log(name, email, mobile, message)
    if (!name || !email || !mobile || !message) {
        next(new AppError('All fields are mandatory'))
        return
    }
    try {
        const userInfo = await contactModel.create(req.body)
        await userInfo.save()
        return res.status(200).json({
            success: true,
            message: 'form submitted successfully'
        })
    }
    catch (e) {
        return next(new AppError(e.message || 'something went wrong', 500))
    }

}

export default contactInfo