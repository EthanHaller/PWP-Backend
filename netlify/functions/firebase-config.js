const { initializeApp } = require("firebase/app")
const { getFirestore } = require("firebase/firestore")
const { getStorage } = require("firebase/storage")
const { getAuth } = require("firebase/auth")
const admin = require("firebase-admin")

const firebaseConfig = {
	apiKey: process.env.apiKey,
	authDomain: process.env.authDomain,
	projectId: process.env.projectId,
	storageBucket: process.env.storageBucket,
	messagingSenderId: process.env.messagingSenderId,
	appId: process.env.appId,
	measurementId: process.env.measurementId,
}

const serviceAccount = {
	type: "service_account",
	project_id: process.env.FIREBASE_PROJECT_ID,
	private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
	private_key: process.env.FIREBASE_PRIVATE_KEY,
	client_email: process.env.FIREBASE_CLIENT_EMAIL,
	client_id: process.env.FIREBASE_CLIENT_ID,
	auth_uri: process.env.FIREBASE_AUTH_URI,
	token_uri: process.env.FIREBASE_TOKEN_URI,
	auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
	client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
	universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
}

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
})

const firebase = initializeApp(firebaseConfig)
const db = getFirestore(firebase)
const auth = getAuth(firebase)
const storage = getStorage(firebase)

module.exports = { db, auth, storage, admin }