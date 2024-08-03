var express = require("express")
var router = express.Router()
const { collection, getDocs, doc, getDoc } = require("firebase/firestore")
const { db } = require("../../netlify/functions/firebase-config")

const getProjects = async (req, res) => {
	try {
		const projectsCollection = collection(db, "projects")
		const querySnapshot = await getDocs(projectsCollection)
		const projects = []
		const totalCount = querySnapshot.size

		querySnapshot.forEach((doc) => {
			const project = { id: doc.id, ...doc.data() }
			projects.push(project)
		})

		res.status(200).send({ totalCount, projects })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.get("/", getProjects)

const getProjectById = async (req, res) => {
	try {
		const projectId = req.params.id
		const projectDoc = doc(db, "projects", projectId)
		const projectSnapshot = await getDoc(projectDoc)

		if (projectSnapshot.exists()) {
			const project = { id: projectSnapshot.id, ...projectSnapshot.data() }
			res.status(200).send(project)
		} else {
			res.status(404).send({ message: "Project not found" })
		}
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.get("/:id", getProjectById)

module.exports = router
