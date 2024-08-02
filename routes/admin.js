const express = require("express")
const router = express.Router()
const { checkAuth } = require("../middleware/authMiddleware")

router.post("/login", (req, res) => {
	res.send("Login endpoint")
})

router.get("/dashboard", checkAuth, (req, res) => {
	res.send("Protected dashboard endpoint")
})

module.exports = router
