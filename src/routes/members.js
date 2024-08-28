const express = require("express")
const router = express.Router()
const multer = require("multer")
const upload = multer()
const { collection, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc, writeBatch } = require("firebase/firestore")
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage")
const { db, storage } = require("../../netlify/functions/firebase-config")

const getMembers = async (req, res) => {
	try {
		const membersCollection = collection(db, "members")
		const querySnapshot = await getDocs(membersCollection)
		const exec = []
		const nonExec = []
		const totalCount = querySnapshot.size

		querySnapshot.forEach((doc) => {
			const member = { id: doc.id, ...doc.data() }
			if (member.execRole) {
				exec.push(member)
			} else {
				nonExec.push(member)
			}
		})

		res.status(200).send({ totalCount, exec, nonExec })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.get("/", getMembers)

const addMember = async (req, res) => {
	try {
		const headshot = req.file
		const { name, execRole } = req.body

		if (!headshot) {
			return res.status(400).send({ message: "No headshot file uploaded" })
		}

		const fileName = `members/${Date.now()}-${headshot.originalname}`
		const storageRef = ref(storage, fileName)

		await uploadBytes(storageRef, headshot.buffer)

		const headshotUrl = await getDownloadURL(storageRef)

		const memberData = { name, execRole, headshotUrl, relativeOrder: 999 }

		const membersCollection = collection(db, "members")
		const newMemberRef = await addDoc(membersCollection, memberData)

		const newMemberDoc = await getDoc(newMemberRef)

		res.status(201).send({ id: newMemberRef.id, ...newMemberDoc.data() })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.post("/add", upload.single("headshot"), addMember)

const updateMember = async (req, res) => {
	try {
		const memberId = req.params.id
		const memberRef = doc(db, "members", memberId)

		let memberData = req.body

		if (req.file) {
			const headshot = req.file
			const fileName = `members/${Date.now()}-${headshot.originalname}`
			const storageRef = ref(storage, fileName)

			await uploadBytes(storageRef, headshot.buffer)

			const headshotUrl = await getDownloadURL(storageRef)

			memberData.headshotUrl = headshotUrl
		}

		const memberDoc = await getDoc(memberRef)
		const curData = memberDoc.data()
		if (memberData?.execRole && curData?.execRole && memberData?.execRole !== curData?.execRole) {
			memberData.relativeOrder = 999
		}
		await updateDoc(memberRef, memberData)
		const updatedMemberDoc = await getDoc(memberRef)

		res.status(201).send({ id: memberId, ...updatedMemberDoc.data() })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.put("/update/:id", upload.single("headshot"), updateMember)

const deleteMember = async (req, res) => {
	try {
		const memberId = req.params.id
		const memberRef = doc(db, "members", memberId)

		const memberDoc = await getDoc(memberRef)

		if (!memberDoc.exists()) {
			return res.status(404).send({ message: "Member not found" })
		}

		const { headshotUrl } = memberDoc.data()

		const filePath = headshotUrl.split("/").slice(-1).join("/").split("?")[0].replace("%2F", "/")

		const fileRef = ref(storage, filePath)

		try {
			await getDownloadURL(fileRef)
			await deleteObject(fileRef)
		} catch (error) {
			if (error.code === "storage/object-not-found") {
				console.log("Headshot does not exist.")
			} else {
				throw error
			}
		}

		await deleteDoc(memberRef)

		res.status(200).send({ message: "Member and associated headshot deleted successfully" })
	} catch (error) {
		console.error(error)
		res.status(500).send(error.message)
	}
}
router.delete("/delete/:id", deleteMember)

const updateRoleOrder = async (req, res) => {
	try {
		const { roles } = req.body

		const membersCollection = collection(db, "members")
		const querySnapshot = await getDocs(membersCollection)
		const members = []

		querySnapshot.forEach((doc) => {
			const member = { id: doc.id, ...doc.data() }
			if (member.execRole) {
				members.push(member)
			}
		})

		const batch = writeBatch(db)
		members.forEach((member) => {
			const newOrderIndex = roles.indexOf(member.execRole)
			if (newOrderIndex !== -1) {
				const memberRef = doc(db, "members", member.id)
				batch.update(memberRef, { relativeOrder: newOrderIndex })
			}
		})

		await batch.commit()

		res.status(200).send({ message: "Role order updated successfully" })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.put("/updateRoleOrder", updateRoleOrder)

module.exports = router
