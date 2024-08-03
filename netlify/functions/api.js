const express = require("express")
const serverless = require("serverless-http")
const cors = require("cors")

const membersRouter = require("../../src/routes/members")
const projectsRouter = require("../../src/routes/projects")
const adminRouter = require("../../src/routes/admin")

const app = express()

app.use(
	cors({
		origin: "*",
		credentials: false,
		methods: "GET,HEAD,OPTIONS,POST,PUT,DELETE",
		allowedHeaders: "Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers Access-Control-Allow-Origin",
	})
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/.netlify/functions/api/members", membersRouter)
app.use("/.netlify/functions/api/projects", projectsRouter)
app.use("/.netlify/functions/api/admin", adminRouter)

exports.handler = serverless(app)
