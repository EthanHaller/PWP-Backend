const express = require("express")
const serverless = require("serverless-http")
const cors = require("cors")

const membersRouter = require("../../src/routes/members")
const projectsRouter = require("../../src/routes/projects")
const partnersRouter = require("../../src/routes/partners")
const countriesRouter = require("../../src/routes/countries")
const recruitmentRouter = require("../../src/routes/recruitment")
const adminRouter = require("../../src/routes/admin")

const app = express()

app.use(
	cors({
		origin: "*",
		credentials: false,
		methods: "GET,HEAD,OPTIONS,POST,PUT,DELETE",
		allowedHeaders: "Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Access-Control-Allow-Origin,Authorization",
	})
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/.netlify/functions/api/members", membersRouter)
app.use("/.netlify/functions/api/projects", projectsRouter)
app.use("/.netlify/functions/api/partners", partnersRouter)
app.use("/.netlify/functions/api/countries", countriesRouter)
app.use("/.netlify/functions/api/recruitment", recruitmentRouter)
app.use("/.netlify/functions/api/admin", adminRouter)

exports.handler = serverless(app)
