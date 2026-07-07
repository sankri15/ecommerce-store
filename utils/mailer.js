const nodemailer = require('nodemailer');

let transporter;

async function setupMailer() {
    // Generate test SMTP service account from ethereal.email
    let testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    console.log("Ethereal Mailer setup complete. Ready to send mock emails.");
}

// Call setup on start
setupMailer();

async function sendMail(to, subject, text, html) {
    if (!transporter) {
        console.error("Transporter not initialized yet.");
        return;
    }
    
    try {
        let info = await transporter.sendMail({
            from: '"EShopit Store" <noreply@eshopit.com>',
            to: to,
            subject: subject,
            text: text,
            html: html,
        });

        console.log("Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error("Error sending mail", err);
    }
}

module.exports = {
    sendMail
};
