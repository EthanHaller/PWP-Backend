var express = require("express")
var router = express.Router()
const { collection, getDocs, addDoc, updateDoc, doc } = require("firebase/firestore")
const { db } = require("../../netlify/functions/firebase-config")

const addPartner = async (req, res) => {
	try {
		const partnerData = req.body
		const partnersCollection = collection(db, "partners")
		const newPartnerRef = await addDoc(partnersCollection, partnerData)
		res.status(201).send({ id: newPartnerRef.id })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.post("/add", addPartner)

const getPartners = async (req, res) => {
	try {
		const partnersCollection = collection(db, "partners")
		const querySnapshot = await getDocs(partnersCollection)
        const partners = []
		const totalCount = querySnapshot.size

		querySnapshot.forEach((doc) => {
			const partner = { id: doc.id, ...doc.data() }
            partners.push(partner)
		})

		res.status(200).send({ totalCount, partners })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.get("/", getPartners)

module.exports = router
