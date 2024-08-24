var express = require("express")
var router = express.Router()
const { collection, getDocs, writeBatch, doc, deleteDoc } = require("firebase/firestore")
const { db } = require("../../netlify/functions/firebase-config")

const addCountries = async (req, res) => {
	try {
		const countriesData = req.body.countries
		const countriesCollection = collection(db, "countries")
		const batch = writeBatch(db)

		countriesData.forEach((countryName) => {
			const countryData = { name: countryName } 
			const newCountryRef = doc(countriesCollection)
			batch.set(newCountryRef, countryData)
		})

		await batch.commit()

		res.status(201).send({ message: "Countries added successfully" })
	} catch (error) {
		res.status(500).send(error.message)
	}
}

router.post("/add", addCountries)

const getCountries = async (req, res) => {
	try {
		const countriesCollection = collection(db, "countries")
		const querySnapshot = await getDocs(countriesCollection)
		const countries = []
		const totalCount = querySnapshot.size

		querySnapshot.forEach((doc) => {
			const country = { id: doc.id, ...doc.data() }
			countries.push(country)
		})

		res.status(200).send({ totalCount, countries })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.get("/", getCountries)

const deleteCountry = async (req, res) => {
	try {
		const { id } = req.params
		const countryDoc = doc(db, "countries", id)
		await deleteDoc(countryDoc)
		res.status(200).send({ message: "Country deleted successfully" })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.delete("/delete/:id", deleteCountry)

module.exports = router
