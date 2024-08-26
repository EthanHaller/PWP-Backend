const { admin } = require("../../netlify/functions/firebase-config")

const checkAuth = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1]

	if (!token) {
		return res.status(401).json({ message: "Unauthorized" })
	}

	admin.auth().verifyIdToken(token)
		.then((decodedToken) => {
			req.user = decodedToken
			next()
		})
		.catch((error) => {
			return res.status(401).json({ message: "Unauthorized" })
		})
}

module.exports = { checkAuth }
