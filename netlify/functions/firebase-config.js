const { initializeApp } = require("firebase/app")
const { getFirestore } = require("firebase/firestore")
const { getStorage } = require("firebase/storage")
const { getAuth } = require("firebase/auth")
const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

const firebaseConfig = {
	apiKey: process.env.apiKey,
	authDomain: process.env.authDomain,
	projectId: process.env.projectId,
	storageBucket: process.env.storageBucket,
	messagingSenderId: process.env.messagingSenderId,
	appId: process.env.appId,
	measurementId: process.env.measurementId,
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firebase = initializeApp(firebaseConfig)
const db = getFirestore(firebase)
const auth = getAuth(firebase)
const storage = getStorage(firebase)

module.exports = { db, auth, storage, admin }
