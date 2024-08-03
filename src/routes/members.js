var express = require("express")
var router = express.Router()
const { collection, getDocs, addDoc, updateDoc, doc } = require("firebase/firestore")
const { db } = require("../../netlify/functions/firebase-config")

const addMember = async (req, res) => {
	try {
		const memberData = req.body
		const membersCollection = collection(db, "members")
		const newMemberRef = await addDoc(membersCollection, memberData)
		res.status(201).send({ id: newMemberRef.id })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.post("/add", addMember)

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

module.exports = router
