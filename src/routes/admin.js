const express = require("express")
const router = express.Router()
const admin = require("firebase-admin")
const { checkAuth } = require("../middleware/authMiddleware")
const crypto = require("crypto")

const listUsers = async (req, res) => {
	try {
		const listUsersResult = await admin.auth().listUsers(1000)
		res.status(200).send(listUsersResult.users)
	} catch (error) {
		res.status(500).send({ error: "Error listing users" })
	}
}
router.get("/list-users", checkAuth, listUsers)

const addUser = async (req, res) => {
	const { email, displayName } = req.body
	const temporaryPassword = generateRandomPassword()

	try {
		const userRecord = await admin.auth().createUser({
			email,
			displayName,
			password: temporaryPassword,
		})

		res.status(200).send({ message: "User created successfully", email })
	} catch (error) {
		res.status(500).send({ error: "Error creating user" })
	}
}
router.post("/add-user", checkAuth, addUser)

function generateRandomPassword(length = 12) {
	return crypto.randomBytes(length).toString("hex").slice(0, length)
}

const deleteUser = async (req, res) => {
	const { uid } = req.params

	try {
		await admin.auth().deleteUser(uid)
		res.status(200).send({ message: "User deleted successfully" })
	} catch (error) {
		console.error("Error deleting user:", error)
		res.status(500).send({ error: "Error deleting user" })
	}
}
router.delete("/delete-user/:uid", checkAuth, deleteUser)

module.exports = router
