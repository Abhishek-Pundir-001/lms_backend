import nodemailer from 'nodemailer';

const sendEmail = async function (email, subject, message) {

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'nasir.zieme41@ethereal.email',
            pass: 'jQ4j5Ew22yv5tYBx2v'
        }
    });

    // async..await is not allowed in global scope, must use a wrapper

    // send mail with defined transport object
    await transporter.sendMail({
        from: '"Nasir Zieme 👻" <nasir.zieme41@ethereal.email>', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        // text: "Hello world?", // plain text body
        html: message, // html body
    });

    // console.log("Message sent: %s", info.messageId);
    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>


}

export default sendEmail

