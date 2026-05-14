import { useState, useEffect } from 'react'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    return onAuthStateChanged(auth, setUser)
  }, [])

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, signInWithGoogle, logout, loading: user === undefined }
}
