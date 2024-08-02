const { initializeApp } = require("firebase/app")
const { getFirestore } = require("firebase/firestore")
const { getAuth } = require("firebase/auth")

const firebaseConfig = {
	apiKey: process.env.apiKey,
	authDomain: process.env.authDomain,
	projectId: process.env.projectId,
	storageBucket: process.env.storageBucket,
	messagingSenderId: process.env.storageBucket,
	appId: process.env.appId,
	measurementId: process.env.measurementId,
}

const firebase = initializeApp(firebaseConfig)
const db = getFirestore(firebase)
const auth = getAuth(firebase);

module.exports = { db, auth }
