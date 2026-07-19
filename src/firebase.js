import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyB0xiFarOL1PBXPsM8yCXnvDn39nm-mXqg',
  authDomain: 'apenas-para-dizer.firebaseapp.com',
  projectId: 'apenas-para-dizer',
  storageBucket: 'apenas-para-dizer.firebasestorage.app',
  messagingSenderId: '866400076778',
  appId: '1:866400076778:web:6069391d5a5881f1f16893',
  measurementId: 'G-H19S6KQJ3B',
}

const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)
const googleProvider = new GoogleAuthProvider()
const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

googleProvider.setCustomParameters({ prompt: 'select_account' })

async function signInWithGoogle() {
  if (window.matchMedia('(max-width: 700px)').matches) {
    await signInWithRedirect(auth, googleProvider)
    return
  }

  await signInWithPopup(auth, googleProvider)
}

async function authorizedFetch(input, init = {}) {
  const user = auth.currentUser

  if (!user) {
    throw new Error('AUTH_REQUIRED')
  }

  const idToken = await user.getIdToken()
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${idToken}`)

  const requestUrl =
    typeof input === 'string' && input.startsWith('/') ? `${apiUrl}${input}` : input

  return fetch(requestUrl, { ...init, headers })
}

export { auth, authorizedFetch, signInWithGoogle }
