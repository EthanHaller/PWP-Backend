var express = require("express")
var router = express.Router()
const nodemailer = require("nodemailer");

const sendEmail = async (req, res) => {
	const body = req.body

	if (!body.email || !body.name || !body.subject || !body.message) {
		return res.status(400).send("All fields are required.")
	}

	try {
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMTP_PORT,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		})

		await transporter.sendMail({
			from: process.env.SMTP_USER,
			to: body.email,
			subject: body.subject,
			text: body.message,
		})

		res.status(200).send("Email sent successfully.")
	} catch (error) {
		console.log(error)
		res.status(500).send("Error sending email.")
	}
}

router.post("/send", sendEmail)

module.exports = router
