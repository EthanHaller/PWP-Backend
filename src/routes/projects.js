const express = require("express")
const router = express.Router()
const multer = require("multer")
const upload = multer()
const { collection, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc } = require("firebase/firestore")
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage")
const { db, storage } = require("../../netlify/functions/firebase-config")

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

const addProject = async (req, res) => {
	try {
		const coverImage = req.files.coverImage[0]
		const presentation = req.files.presentation[0]
		const { title, date } = req.body

		if (!coverImage || !presentation) {
			return res.status(400).send({ message: "Cover image and presentation file are required" })
		}

		const dateObj = new Date(date)

		const coverImageName = `projects/${Date.now()}-${coverImage.originalname}`
		const coverImageRef = ref(storage, coverImageName)
		await uploadBytes(coverImageRef, coverImage.buffer, { contentType: coverImage.mimetype })
		const coverImageUrl = await getDownloadURL(coverImageRef)

		const presentationName = `projects/${Date.now()}-${presentation.originalname}`
		const presentationRef = ref(storage, presentationName)
		await uploadBytes(presentationRef, presentation.buffer, { contentType: presentation.mimetype })
		const presentationUrl = await getDownloadURL(presentationRef)

		const projectData = { title, coverImageUrl, presentationUrl, date: dateObj }

		const projectsCollection = collection(db, "projects")
		const newProjectRef = await addDoc(projectsCollection, projectData)
		const newProjectDoc = await getDoc(newProjectRef)

		res.status(201).send({ id: newProjectRef.id, ...newProjectDoc.data() })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.post("/add", upload.fields([{ name: "coverImage" }, { name: "presentation" }]), addProject)

const updateProject = async (req, res) => {
	try {
		const projectId = req.params.id
		const projectRef = doc(db, "projects", projectId)

		let projectData = req.body

		if (projectData.date) {
			projectData.date = new Date(projectData.date)
		}

		if (req.files.coverImage) {
			const coverImage = req.files.coverImage[0]
			const coverImageName = `projects/${Date.now()}-${coverImage.originalname}`
			const coverImageRef = ref(storage, coverImageName)
			await uploadBytes(coverImageRef, coverImage.buffer, { contentType: coverImage.mimetype })
			const coverImageUrl = await getDownloadURL(coverImageRef)
			projectData.coverImageUrl = coverImageUrl
		}

		if (req.files.presentation) {
			const presentation = req.files.presentation[0]
			const presentationName = `projects/${Date.now()}-${presentation.originalname}`
			const presentationRef = ref(storage, presentationName)
			await uploadBytes(presentationRef, presentation.buffer, { contentType: presentation.mimetype })
			const presentationUrl = await getDownloadURL(presentationRef)
			projectData.presentationUrl = presentationUrl
		}

		await updateDoc(projectRef, projectData)
		const updatedProjectDoc = await getDoc(projectRef)

		res.status(201).send({ id: projectId, ...updatedProjectDoc.data() })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.put("/update/:id", upload.fields([{ name: "coverImage" }, { name: "presentation" }]), updateProject)

const deleteProject = async (req, res) => {
	try {
		const projectId = req.params.id
		const projectRef = doc(db, "projects", projectId)

		const projectDoc = await getDoc(projectRef)

		if (!projectDoc.exists()) {
			return res.status(404).send({ message: "Project not found" })
		}

		const { coverImageUrl, presentationUrl } = projectDoc.data()

		const coverImagePath = coverImageUrl.split("/").slice(-1).join("/").split("?")[0].replace("%2F", "/")
		const presentationPath = presentationUrl.split("/").slice(-1).join("/").split("?")[0].replace("%2F", "/")

		const coverImageRef = ref(storage, coverImagePath)
		const presentationRef = ref(storage, presentationPath)

		try {
			await getDownloadURL(coverImageRef)
			await deleteObject(coverImageRef)
		} catch (error) {
			if (error.code === "storage/object-not-found") {
				console.log("Cover image does not exist.")
			} else {
				throw error
			}
		}

		try {
			await getDownloadURL(presentationRef)
			await deleteObject(presentationRef)
		} catch (error) {
			if (error.code === "storage/object-not-found") {
				console.log("Presentation file does not exist.")
			} else {
				throw error
			}
		}

		await deleteDoc(projectRef)

		res.status(200).send({ message: "Project and associated files deleted successfully" })
	} catch (error) {
		console.error(error)
		res.status(500).send(error.message)
	}
}
router.delete("/delete/:id", deleteProject)

module.exports = router
