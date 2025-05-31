// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  arrayRemove,
} from "firebase/firestore"
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
}

// Initialize Firebase
let app
let db
let auth
let analytics

// Initialize Firebase only on the client side
if (typeof window !== "undefined") {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig)
      db = getFirestore(app)
      auth = getAuth(app)
      if (process.env.NODE_ENV === "production") {
        analytics = getAnalytics(app)
      }
      console.log("Firebase initialized successfully")
    } catch (error) {
      console.error("Firebase initialization error", error)
    }
  } else {
    app = getApps()[0]
    db = getFirestore(app)
    auth = getAuth(app)
  }
}

// Local storage keys
const LOCAL_STORAGE_KEY = "local_reviews"
const LOCAL_COMMENTS_KEY = "local_comments"

// Get local data
const getLocalReviews = () => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error getting local reviews:", error)
    return []
  }
}

const getLocalComments = () => {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(LOCAL_COMMENTS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error("Error getting local comments:", error)
    return {}
  }
}

// Save local review
const saveLocalReview = (review) => {
  if (typeof window === "undefined") return null
  try {
    const reviews = getLocalReviews()
    const newReview = {
      ...review,
      id: `local_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    reviews.push(newReview)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reviews))
    return newReview.id
  } catch (error) {
    console.error("Error saving local review:", error)
    return null
  }
}

// Save local comment
const saveLocalComment = (reviewId, comment) => {
  if (typeof window === "undefined") return false
  try {
    const localComments = getLocalComments()

    if (!localComments[reviewId]) {
      localComments[reviewId] = []
    }

    localComments[reviewId].push({
      ...comment,
      id: `comment_${Date.now()}`,
      createdAt: new Date().toISOString(),
    })

    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(localComments))
    return true
  } catch (error) {
    console.error("Error saving local comment:", error)
    return false
  }
}

const deleteLocalReview = (id) => {
  if (typeof window === "undefined") return false
  try {
    const reviews = getLocalReviews()
    const filteredReviews = reviews.filter((review) => review.id !== id)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredReviews))

    // Also delete any local comments for this review
    const localComments = getLocalComments()
    delete localComments[id]
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(localComments))

    return true
  } catch (error) {
    console.error("Error deleting local review:", error)
    return false
  }
}

// Delete local comment
const deleteLocalComment = (reviewId, commentId) => {
  if (typeof window === "undefined") return false
  try {
    const localComments = getLocalComments()

    if (!localComments[reviewId]) {
      return false
    }

    localComments[reviewId] = localComments[reviewId].filter((comment) => comment.id !== commentId)

    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(localComments))
    return true
  } catch (error) {
    console.error("Error deleting local comment:", error)
    return false
  }
}

// Reviews collection reference - with null check for SSR
const reviewsCollection = () => {
  if (!db) return null
  return collection(db, "reviews")
}

// Add a new review
export const addReview = async (reviewData) => {
  try {
    // Try Firebase first
    if (db) {
      try {
        const collectionRef = reviewsCollection()
        if (collectionRef) {
          const docRef = await addDoc(collectionRef, {
            ...reviewData,
            createdAt: serverTimestamp(),
            comments: [],
          })
          console.log("Document written with ID: ", docRef.id)
          return { id: docRef.id, success: true, source: "firebase" }
        }
      } catch (firebaseError) {
        console.error("Firebase error, falling back to local storage:", firebaseError)
        // If Firebase fails, fall back to local storage
        const localId = saveLocalReview({
          ...reviewData,
          comments: [],
        })
        return { id: localId, success: true, source: "local" }
      }
    }

    // If Firebase is not initialized or the above code didn't return, use local storage
    const localId = saveLocalReview({
      ...reviewData,
      comments: [],
    })
    return { id: localId, success: true, source: "local" }
  } catch (error) {
    console.error("Error adding review:", error)
    throw error
  }
}

// Get all reviews
export const getReviews = async () => {
  try {
    let firestoreReviews = []

    // Try to get reviews from Firestore only if online
    if (typeof window !== "undefined" && db && isOnline()) {
      try {
        const collectionRef = reviewsCollection()
        if (collectionRef) {
          const q = query(collectionRef, orderBy("createdAt", "desc"))
          const snapshot = await getDocs(q)
          firestoreReviews = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            source: "firebase",
          }))
        }
      } catch (firebaseError) {
        // ไม่แสดง error ใน console
      }
    }

    // Get local reviews
    const localReviews =
      typeof window !== "undefined"
        ? getLocalReviews().map((review) => ({
            ...review,
            source: "local",
          }))
        : []

    // Combine both sources
    return [...firestoreReviews, ...localReviews]
  } catch (error) {
    // ไม่แสดง error ใน console
    // Return local reviews if available, otherwise empty array
    return typeof window !== "undefined" ? getLocalReviews() : []
  }
}

// Get a single review by ID
export const getReview = async (id) => {
  try {
    // Check if it's a local review
    if (id.startsWith("local_")) {
      const localReviews = getLocalReviews()
      const review = localReviews.find((r) => r.id === id)
      return review || null
    }

    // Otherwise try Firestore only if online
    if (!db || !isOnline()) {
      // ถ้าไม่มีการเชื่อมต่อเครือข่าย ให้ตรวจสอบว่ามีความคิดเห็นที่เก็บในเครื่องหรือไม่
      const localComments = getLocalComments()[id] || []
      if (localComments.length > 0) {
        return {
          id,
          title: "ไม่สามารถโหลดรีวิวได้",
          author: "ไม่ทราบ",
          date: new Date().toISOString().split("T")[0],
          content: "ไม่สามารถโหลดรีวิวได้เนื่องจากไม่มีการเชื่อมต่อเครือข่าย",
          rating: 0,
          comments: localComments,
          hasLocalComments: true,
        }
      }
      return null
    }

    const docRef = doc(db, "reviews", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const reviewData = {
        id: docSnap.id,
        ...docSnap.data(),
      }

      // Check for local comments for this review
      const localComments = getLocalComments()[id] || []

      // If there are local comments, merge them with the Firebase comments
      if (localComments.length > 0) {
        if (!reviewData.comments) {
          reviewData.comments = []
        }

        reviewData.comments = [...reviewData.comments, ...localComments]
        reviewData.hasLocalComments = true
      }

      return reviewData
    } else {
      return null
    }
  } catch (error) {
    // ไม่แสดง error ใน console
    return null
  }
}

// Add a comment to a review
export const addComment = async (reviewId, commentData) => {
  try {
    // Check if it's a local review
    if (reviewId.startsWith("local_")) {
      const localReviews = getLocalReviews()
      const reviewIndex = localReviews.findIndex((r) => r.id === reviewId)

      if (reviewIndex >= 0) {
        if (!localReviews[reviewIndex].comments) {
          localReviews[reviewIndex].comments = []
        }

        const newComment = {
          ...commentData,
          id: `comment_${Date.now()}`,
          createdAt: new Date().toISOString(),
        }

        localReviews[reviewIndex].comments.push(newComment)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localReviews))
        return { success: true, source: "local" }
      }
      return { success: false }
    }

    // Otherwise try Firestore
    if (!db) {
      // If Firebase is not initialized, save comment locally
      const saved = saveLocalComment(reviewId, commentData)
      return { success: saved, source: "local" }
    }

    try {
      const reviewRef = doc(db, "reviews", reviewId)

      await updateDoc(reviewRef, {
        comments: arrayUnion({
          ...commentData,
          createdAt: new Date().toISOString(), // ใช้ Date ธรรมดาแทน serverTimestamp()
        }),
      })
      return { success: true, source: "firebase" }
    } catch (firebaseError) {
      console.error("Firebase error, falling back to local storage for comment:", firebaseError)
      // If Firebase fails due to permissions, save comment locally
      const saved = saveLocalComment(reviewId, commentData)
      return { success: saved, source: "local" }
    }
  } catch (error) {
    console.error("Error adding comment:", error)
    throw error
  }
}

// Delete a review
export const deleteReview = async (id) => {
  try {
    // Check if it's a local review
    if (id.startsWith("local_")) {
      return deleteLocalReview(id)
    }

    // Otherwise try Firestore
    if (!db) throw new Error("Firebase not initialized")

    await deleteDoc(doc(db, "reviews", id))

    // Also delete any local comments for this review
    const localComments = getLocalComments()
    delete localComments[id]
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(localComments))

    return true
  } catch (error) {
    console.error("Error deleting review:", error)
    throw error
  }
}

// Delete a comment
export const deleteComment = async (reviewId, commentId) => {
  try {
    // Check if offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      // ถ้าไม่มีการเชื่อมต่อเครือข่าย ให้ลองลบจาก localStorage ก่อน

      // For local reviews, update the review object
      if (reviewId.startsWith("local_")) {
        const localReviews = getLocalReviews()
        const reviewIndex = localReviews.findIndex((r) => r.id === reviewId)

        if (reviewIndex >= 0 && localReviews[reviewIndex].comments) {
          localReviews[reviewIndex].comments = localReviews[reviewIndex].comments.filter(
            (comment) => comment.id !== commentId,
          )
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localReviews))
          return { success: true, source: "local" }
        }
      }

      // For local comments on Firebase reviews
      const deleted = deleteLocalComment(reviewId, commentId)
      return { success: deleted, source: "local" }
    }

    // Check if it's a local comment (either in a local review or stored locally for a Firebase review)
    if (reviewId.startsWith("local_") || commentId.startsWith("comment_")) {
      // For local reviews, update the review object
      if (reviewId.startsWith("local_")) {
        const localReviews = getLocalReviews()
        const reviewIndex = localReviews.findIndex((r) => r.id === reviewId)

        if (reviewIndex >= 0 && localReviews[reviewIndex].comments) {
          localReviews[reviewIndex].comments = localReviews[reviewIndex].comments.filter(
            (comment) => comment.id !== commentId,
          )
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localReviews))
          return { success: true, source: "local" }
        }
      }

      // For local comments on Firebase reviews
      const deleted = deleteLocalComment(reviewId, commentId)
      return { success: deleted, source: "local" }
    }

    // Otherwise try Firestore
    if (!db) {
      throw new Error("Firebase not initialized")
    }

    // Get the review document
    const reviewRef = doc(db, "reviews", reviewId)
    const reviewSnap = await getDoc(reviewRef)

    if (!reviewSnap.exists()) {
      throw new Error("Review not found")
    }

    const reviewData = reviewSnap.data()

    // Find the comment to delete
    const commentToDelete = reviewData.comments?.find((comment) => comment.id === commentId)

    if (!commentToDelete) {
      throw new Error("Comment not found")
    }

    // Remove the comment from the array
    await updateDoc(reviewRef, {
      comments: arrayRemove(commentToDelete),
    })

    return { success: true, source: "firebase" }
  } catch (error) {
    // ไม่แสดง error ใน console
    return { success: false, error: error.message }
  }
}

// Authentication functions
export const signIn = async (email, password) => {
  if (!auth) throw new Error("Firebase Auth not initialized")

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("Error signing in:", error)
    throw error
  }
}

export const signOut = async () => {
  if (!auth) throw new Error("Firebase Auth not initialized")

  try {
    await firebaseSignOut(auth)
    return true
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

export const getCurrentUser = () => {
  return auth?.currentUser || null
}

export const onAuthStateChange = (callback) => {
  if (!auth) return () => {}

  return onAuthStateChanged(auth, callback)
}

export const isDemoAdmin = () => {
  if (typeof window === "undefined") return false
  return localStorage.getItem("demo_admin_mode") === "true"
}

// ตรวจสอบสถานะการเชื่อมต่อเครือข่าย
export const isOnline = () => {
  // ตรวจสอบว่ามีการเชื่อมต่อเครือข่ายหรือไม่
  const hasNetwork = typeof navigator !== "undefined" && navigator.onLine

  // ตรวจสอบว่า Firebase ถูกเริ่มต้นแล้วหรือไม่
  const hasFirebase = !!db

  console.log("Network status:", hasNetwork ? "online" : "offline")
  console.log("Firebase initialized:", hasFirebase ? "yes" : "no")

  return hasNetwork && hasFirebase
}

export { db, auth }
