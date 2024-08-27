var express = require("express")
var router = express.Router()
const multer = require("multer")
const upload = multer()
const { collection, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc } = require("firebase/firestore")
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage")
const { db, storage } = require("../../netlify/functions/firebase-config")

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

const addPartner = async (req, res) => {
	try {
		const image = req.file
		const name = req.body.name

		if (!image) {
			return res.status(400).send({ message: "No image file uploaded" })
		}

		const fileName = `partners/${Date.now()}-${image.originalname}`
		const storageRef = ref(storage, fileName)

		await uploadBytes(storageRef, image.buffer)

		const imageUrl = await getDownloadURL(storageRef)

		const partnerData = { name, imageUrl }

		const partnersCollection = collection(db, "partners")
		const newPartnerRef = await addDoc(partnersCollection, partnerData)

		const newPartnerDoc = await getDoc(newPartnerRef)

		res.status(201).send({ id: newPartnerRef.id, ...newPartnerDoc.data() })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.post("/add", upload.single("image"), addPartner)

const updatePartner = async (req, res) => {
	try {
		const partnerId = req.params.id
		const partnerRef = doc(db, "partners", partnerId)

		let partnerData = req.body

		if (req.file) {
			const image = req.file
			const fileName = `partners/${Date.now()}-${image.originalname}`
			const storageRef = ref(storage, fileName)

			await uploadBytes(storageRef, image.buffer)

			const imageUrl = await getDownloadURL(storageRef)

			partnerData.imageUrl = imageUrl
		}

		await updateDoc(partnerRef, partnerData)
		const updatedPartnerDoc = await getDoc(partnerRef)

		res.status(201).send({ id: partnerId, ...updatedPartnerDoc.data() })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.put("/update/:id", upload.single("image"), updatePartner)

const deletePartner = async (req, res) => {
	try {
		const partnerId = req.params.id
		const partnerRef = doc(db, "partners", partnerId)

		const partnerDoc = await getDoc(partnerRef)

		if (!partnerDoc.exists()) {
			return res.status(404).send({ message: "Partner not found" })
		}

		const { imageUrl } = partnerDoc.data()

		const filePath = imageUrl.split("/").slice(-1).join("/").split("?")[0].replace("%2F", "/")

		const fileRef = ref(storage, filePath)

		try {
			await getDownloadURL(fileRef)
			await deleteObject(fileRef)
		} catch (error) {
			if (error.code === "storage/object-not-found") {
				console.log("Image does not exist.")
			} else {
				throw error
			}
		}

		await deleteDoc(partnerRef)

		res.status(200).send({ message: "Partner and associated image deleted successfully" })
	} catch (error) {
		console.error(error)
		res.status(500).send(error.message)
	}
}
router.delete("/delete/:id", deletePartner)

module.exports = router
