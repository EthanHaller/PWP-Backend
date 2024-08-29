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
		const execRolesCollection = collection(db, "execRoles")
		const querySnapshot = await getDocs(membersCollection)
		const exec = []
		const nonExec = []
		const totalCount = querySnapshot.size

		for (const d of querySnapshot.docs) {
			const member = { id: d.id, ...d.data() }
			if (member.execRole) {
				const execRoleDoc = await getDoc(member.execRole)
				if (execRoleDoc.exists()) {
					const execRoleData = execRoleDoc.data()
					member.execRole = execRoleData.name
					member.relativeOrder = execRoleData.relativeOrder
				}
				exec.push(member)
			} else {
				nonExec.push(member)
			}
		}

		res.status(200).send({ totalCount, exec, nonExec })
	} catch (error) {
		console.error(error)
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

		let execRoleRef = null
		if (execRole) {
			const execRolesCollection = collection(db, "execRoles")
			const execRoleSnapshot = await getDocs(execRolesCollection)
			let execRoleDoc = execRoleSnapshot.docs.find((doc) => doc.data().name === execRole)

			if (!execRoleDoc) {
				const newExecRoleRef = await addDoc(execRolesCollection, { name: execRole, relativeOrder: 999 })
				execRoleRef = newExecRoleRef
			} else {
				execRoleRef = execRoleDoc.ref
			}
		}

		const memberData = { name, execRole: execRoleRef, headshotUrl }

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

		if (memberData.execRole) {
			const execRolesCollection = collection(db, "execRoles")
			const execRoleSnapshot = await getDocs(execRolesCollection)
			let execRoleDoc = execRoleSnapshot.docs.find((doc) => doc.data().name === memberData.execRole)

			if (!execRoleDoc) {
				const newExecRoleRef = await addDoc(execRolesCollection, { name: memberData.execRole, relativeOrder: 999 })
				memberData.execRole = newExecRoleRef
			} else {
				memberData.execRole = execRoleDoc.ref
			}
		}

		console.log(memberData)

		await updateDoc(memberRef, memberData)
		const updatedMemberDoc = await getDoc(memberRef)

		res.status(200).send({ id: memberId, ...updatedMemberDoc.data() })
	} catch (error) {
		console.error(error)
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

		const execRolesCollection = collection(db, "execRoles")
		const execRoleSnapshot = await getDocs(execRolesCollection)
		const batch = writeBatch(db)

		roles.forEach((roleName, index) => {
			const execRoleDoc = execRoleSnapshot.docs.find((doc) => doc.data().name === roleName)
			if (execRoleDoc) {
				const execRoleRef = doc(execRolesCollection, execRoleDoc.id)
				batch.update(execRoleRef, { relativeOrder: index })
			}
		})

		await batch.commit()

		res.status(200).send({ message: "Role order updated successfully in execRoles collection" })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.put("/updateRoleOrder", updateRoleOrder)

module.exports = router
