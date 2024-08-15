var express = require("express")
var router = express.Router()
const { collection, getDocs, addDoc } = require("firebase/firestore")
const { db } = require("../../netlify/functions/firebase-config")

const addCountry = async (req, res) => {
	try {
		const countryData = req.body
		const countriesCollection = collection(db, "countries")
		const newCountryRef = await addDoc(countriesCollection, countryData)
		res.status(201).send({ id: newCountryRef.id })
	} catch (error) {
		res.status(500).send(error.message)
	}
}
router.post("/add", addCountry)

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

module.exports = router
