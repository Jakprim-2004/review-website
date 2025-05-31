import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  where,
  Timestamp,
  deleteDoc,
} from "firebase/firestore"
import { db, getCurrentUser, isDemoAdmin, isOnline } from "./firebase"

// ประเภทข้อมูลสำหรับข้อความแชท
export interface ChatMessage {
  id?: string
  text: string
  author: string
  createdAt: Date | any
  photoURL?: string
  isLocal?: boolean
  roomId: string
}

// ประเภทข้อมูลสำหรับห้องแชท
export interface ChatRoom {
  id: string
  name: string
  description: string
  createdAt: Date | any
  lastActivity: Date | any
  createdBy: string
  activeUsers: number
  isLocal?: boolean
}

// คอลเลกชันสำหรับข้อความแชท
const getChatCollection = () => {
  if (!db) return null
  return collection(db, "chats")
}

// คอลเลกชันสำหรับห้องแชท
const getChatRoomsCollection = () => {
  if (!db) return null
  return collection(db, "chatrooms")
}

// เพิ่มข้อความแชทใหม่
export const addChatMessage = async (message: Omit<ChatMessage, "createdAt" | "id">) => {
  try {
    // ตรวจสอบว่ามีการเชื่อมต่อกับ Firebase หรือไม่
    if (db && isOnline()) {
      try {
        const chatCollection = getChatCollection()
        if (chatCollection) {
          console.log("Sending message to Firebase:", message)
          const docRef = await addDoc(chatCollection, {
            ...message,
            createdAt: serverTimestamp(),
          })
          console.log("Message sent successfully with ID:", docRef.id)

          // อัปเดตเวลากิจกรรมล่าสุดของห้อง
          await updateRoomLastActivity(message.roomId)

          return { id: docRef.id, success: true, source: "firebase" }
        } else {
          console.error("Chat collection is null")
          return saveLocalChatMessage(message)
        }
      } catch (error) {
        console.error("Error sending message to Firebase:", error)
        // ถ้าเกิดข้อผิดพลาดกับ Firebase ให้เก็บข้อความไว้ใน localStorage
        return saveLocalChatMessage(message)
      }
    } else {
      console.log("Offline or Firebase not initialized, saving message locally")
      // ถ้าไม่มีการเชื่อมต่อกับ Firebase ให้เก็บข้อความไว้ใน localStorage
      return saveLocalChatMessage(message)
    }
  } catch (error) {
    console.error("Unexpected error in addChatMessage:", error)
    return { success: false, error: "ไม่สามารถส่งข้อความได้" }
  }
}

// อัปเดตเวลากิจกรรมล่าสุดของห้อง
export const updateRoomLastActivity = async (roomId: string) => {
  if (!db || !isOnline() || !roomId) return false

  try {
    console.log("Updating room last activity for room:", roomId)
    const roomRef = doc(db, "chatrooms", roomId)
    await updateDoc(roomRef, {
      lastActivity: serverTimestamp(),
    })
    console.log("Room last activity updated successfully")
    return true
  } catch (error) {
    console.error("Error updating room last activity:", error)
    return false
  }
}

// สร้างห้องแชทใหม่
export const createChatRoom = async (roomData: Omit<ChatRoom, "id" | "createdAt" | "lastActivity" | "activeUsers">) => {
  try {
    // ตรวจสอบว่ามีการเชื่อมต่อกับ Firebase หรือไม่
    if (db && isOnline()) {
      try {
        const roomsCollection = getChatRoomsCollection()
        if (roomsCollection) {
          console.log("Creating room in Firebase:", roomData)
          const docRef = await addDoc(roomsCollection, {
            ...roomData,
            createdAt: serverTimestamp(),
            lastActivity: serverTimestamp(),
            activeUsers: 0,
          })
          console.log("Room created successfully with ID:", docRef.id)
          return { id: docRef.id, success: true, source: "firebase" }
        } else {
          console.error("Rooms collection is null")
          return saveLocalChatRoom(roomData)
        }
      } catch (error) {
        console.error("Error creating room in Firebase:", error)
        // ถ้าเกิดข้อผิดพลาดกับ Firebase ให้เก็บห้องไว้ใน localStorage
        return saveLocalChatRoom(roomData)
      }
    } else {
      console.log("Offline or Firebase not initialized, saving room locally")
      // ถ้าไม่มีการเชื่อมต่อกับ Firebase ให้เก็บห้องไว้ใน localStorage
      return saveLocalChatRoom(roomData)
    }
  } catch (error) {
    console.error("Unexpected error in createChatRoom:", error)
    return { success: false, error: "ไม่สามารถสร้างห้องแชทได้" }
  }
}

// ดึงข้อมูลห้องแชท
export const getChatRoom = async (roomId: string): Promise<ChatRoom | null> => {
  try {
    // ตรวจสอบว่าเป็นห้องที่เก็บใน localStorage หรือไม่
    if (roomId.startsWith("local_")) {
      const localRooms = getLocalChatRooms()
      const room = localRooms.find((r) => r.id === roomId)
      return room || null
    }

    // ถ้าไม่มีการเชื่อมต่อกับ Firebase ให้ return null
    if (!db || !isOnline()) return null

    const roomRef = doc(db, "chatrooms", roomId)
    const roomSnap = await getDoc(roomRef)

    if (roomSnap.exists()) {
      const roomData = roomSnap.data()
      return {
        id: roomSnap.id,
        name: roomData.name,
        description: roomData.description,
        createdAt: roomData.createdAt?.toDate() || new Date(),
        lastActivity: roomData.lastActivity?.toDate() || new Date(),
        createdBy: roomData.createdBy,
        activeUsers: roomData.activeUsers || 0,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting chat room:", error)
    return null
  }
}

// ดึงรายการห้องแชททั้งหมด
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  try {
    let firestoreRooms: ChatRoom[] = []

    // ดึงห้องจาก Firebase
    if (db && isOnline()) {
      try {
        const roomsCollection = getChatRoomsCollection()
        if (roomsCollection) {
          console.log("Fetching rooms from Firebase")
          const q = query(roomsCollection, orderBy("lastActivity", "desc"))
          const snapshot = await getDocs(q)
          firestoreRooms = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            description: doc.data().description,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastActivity: doc.data().lastActivity?.toDate() || new Date(),
            createdBy: doc.data().createdBy,
            activeUsers: doc.data().activeUsers || 0,
          }))
          console.log("Fetched rooms:", firestoreRooms.length)
        }
      } catch (error) {
        console.error("Error fetching rooms from Firebase:", error)
      }
    }

    // ดึงห้องจาก localStorage
    const localRooms = getLocalChatRooms().map((room) => ({
      ...room,
      isLocal: true,
    }))

    // รวมห้องจากทั้งสองแหล่ง
    return [...firestoreRooms, ...localRooms]
  } catch (error) {
    console.error("Error getting chat rooms:", error)
    return []
  }
}

// ติดตามรายการห้องแชทแบบเรียลไทม์
export const subscribeToChatRooms = (callback: (rooms: ChatRoom[]) => void) => {
  // ดึงห้องจาก localStorage
  const localRooms = getLocalChatRooms().map((room) => ({
    ...room,
    isLocal: true,
  }))

  // ถ้าไม่มีการเชื่อมต่อกับ Firebase ให้ใช้ห้องจาก localStorage เท่านั้น
  if (!db || !isOnline()) {
    console.log("Offline or Firebase not initialized, using local rooms only")
    callback(localRooms)
    return () => {}
  }

  const roomsCollection = getChatRoomsCollection()
  if (!roomsCollection) {
    console.error("Rooms collection is null")
    callback(localRooms)
    return () => {}
  }

  console.log("Setting up real-time listener for rooms")
  // สร้าง query เพื่อดึงห้องทั้งหมด เรียงตามเวลากิจกรรมล่าสุด
  const q = query(roomsCollection, orderBy("lastActivity", "desc"))

  // ติดตามการเปลี่ยนแปลงของห้องแชท
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("Rooms snapshot received, count:", snapshot.docs.length)
      const rooms = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
          createdBy: data.createdBy,
          activeUsers: data.activeUsers || 0,
        }
      })

      // รวมห้องจาก Firebase และ localStorage
      const combinedRooms = [...rooms, ...localRooms.filter((room) => !rooms.some((r) => r.id === room.id))]
      console.log("Combined rooms:", combinedRooms.length)

      callback(combinedRooms)
    },
    (error) => {
      console.error("Error in rooms snapshot listener:", error)
      // ถ้าเกิดข้อผิดพลาด ให้ใช้ห้องจาก localStorage
      callback(localRooms)
    },
  )

  return unsubscribe
}

// ฟังก์ชันสำหรับติดตามข้อความแชทแบบเรียลไทม์ในห้องที่ระบุ
export const subscribeToChatMessages = (
  roomId: string,
  callback: (messages: ChatMessage[]) => void,
  messagesLimit = 100,
) => {
  // ดึงข้อความจาก localStorage ก่อน
  const localMessages = getLocalChatMessages().filter((msg) => msg.roomId === roomId)

  // ถ้าไม่มีการเชื่อมต่อกับ Firebase ให้ใช้ข้อความจาก localStorage เท่านั้น
  if (!db || !isOnline()) {
    console.log("Offline or Firebase not initialized, using local messages only")
    callback(localMessages)
    return () => {}
  }

  const chatCollection = getChatCollection()
  if (!chatCollection) {
    console.error("Chat collection is null")
    callback(localMessages)
    return () => {}
  }

  console.log("Setting up real-time listener for messages in room:", roomId)

  // ใช้ query ที่ไม่ต้องการ index เป็นค่าเริ่มต้น
  // เนื่องจาก try-catch ไม่สามารถจับข้อผิดพลาดที่เกิดขึ้นในขณะที่ query กำลังทำงาน
  const q = query(chatCollection, where("roomId", "==", roomId))
  console.log("Using simple query without index requirements")

  // ติดตามการเปลี่ยนแปลงของข้อความแชท
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("Messages snapshot received, count:", snapshot.docs.length)
      let messages = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        }
      }) as ChatMessage[]

      // ถ้าใช้ query ที่ไม่มี orderBy เราต้องเรียงข้อมูลเอง
      if (!q.toString().includes("orderBy")) {
        messages = messages.sort((a, b) => {
          return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
        })
        // จำกัดจำนวนข้อความ
        if (messages.length > messagesLimit) {
          messages = messages.slice(-messagesLimit)
        }
      } else {
        // ถ้าใช้ orderBy("createdAt", "desc") เราต้องกลับลำดับ
        messages = messages.reverse()
      }

      // รวมข้อความจาก Firebase และ localStorage
      const combinedMessages = [...messages, ...localMessages.filter((msg) => msg.isLocal)]

      // เรียงข้อความตามเวลา
      combinedMessages.sort((a, b) => {
        return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
      })

      console.log("Combined messages:", combinedMessages.length)
      callback(combinedMessages)
    },
    (error) => {
      console.error("Error in messages snapshot listener:", error)

      // แสดงข้อความแนะนำให้สร้าง index
      if (error.toString().includes("index")) {
        console.warn(
          "This query requires a Firebase index. Please create the index using the link in the error message above.",
        )
      }

      // ถ้าเกิดข้อผิดพลาด ให้ใช้ข้อความจาก localStorage
      callback(localMessages)
    },
  )

  return unsubscribe
}

// เข้าร่วมห้องแชท (เพิ่มจำนวนผู้ใช้ในห้อง)
export const joinChatRoom = async (roomId: string) => {
  if (!db || !isOnline() || roomId.startsWith("local_")) return false

  try {
    console.log("Joining room:", roomId)
    const roomRef = doc(db, "chatrooms", roomId)
    const roomSnap = await getDoc(roomRef)

    if (roomSnap.exists()) {
      await updateDoc(roomRef, {
        activeUsers: (roomSnap.data().activeUsers || 0) + 1,
        lastActivity: serverTimestamp(),
      })
      console.log("Joined room successfully")
      return true
    }
    console.error("Room does not exist:", roomId)
    return false
  } catch (error) {
    console.error("Error joining chat room:", error)
    return false
  }
}

// ออกจากห้องแชท (ลดจำนวนผู้ใช้ในห้อง)
export const leaveChatRoom = async (roomId: string) => {
  if (!db || !isOnline() || roomId.startsWith("local_")) return false

  try {
    console.log("Leaving room:", roomId)
    const roomRef = doc(db, "chatrooms", roomId)
    const roomSnap = await getDoc(roomRef)

    if (roomSnap.exists()) {
      const currentActiveUsers = roomSnap.data().activeUsers || 0
      await updateDoc(roomRef, {
        activeUsers: Math.max(0, currentActiveUsers - 1),
        lastActivity: serverTimestamp(),
      })
      console.log("Left room successfully")
      return true
    }
    console.error("Room does not exist:", roomId)
    return false
  } catch (error) {
    console.error("Error leaving chat room:", error)
    return false
  }
}

// ตรวจสอบและลบห้องที่ไม่มีกิจกรรม
export const cleanupInactiveRooms = async () => {
  if (!db || !isOnline()) return

  try {
    const roomsCollection = getChatRoomsCollection()
    if (!roomsCollection) return

    // คำนวณเวลาที่ผ่านมา 30 นาที
    const thirtyMinutesAgo = new Date()
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)

    console.log("Checking for inactive rooms older than:", thirtyMinutesAgo)

    // แทนที่จะใช้ composite query ที่ต้องการ index
    // เราจะดึงห้องที่ไม่มีกิจกรรมเกิน 30 นาทีก่อน แล้วค่อยกรองเฉพาะห้องที่ไม่มีผู้ใช้ในหน่วยความจำ
    const q = query(roomsCollection, where("lastActivity", "<", Timestamp.fromDate(thirtyMinutesAgo)))

    const snapshot = await getDocs(q)
    console.log("Found rooms with no recent activity:", snapshot.docs.length)

    // กรองและลบเฉพาะห้องที่ไม่มีผู้ใช้
    let deletedCount = 0
    for (const doc of snapshot.docs) {
      const roomData = doc.data()
      if (roomData.activeUsers === 0) {
        console.log("Deleting inactive room:", doc.id)
        await deleteDoc(doc.ref)
        deletedCount++
      }
    }

    console.log(`Deleted ${deletedCount} inactive rooms`)
  } catch (error) {
    console.error("Error cleaning up inactive rooms:", error)

    // ตรวจสอบว่าเป็นข้อผิดพลาดเกี่ยวกับ index หรือไม่
    const errorMessage = error.toString()
    if (errorMessage.includes("index") && errorMessage.includes("https://console.firebase.google.com")) {
      console.warn(
        "This query requires a Firebase index. Please create the index using the link in the error message above, " +
          "or modify the cleanupInactiveRooms function to avoid using a composite index.",
      )
    }
  }
}

// ฟังก์ชันสำหรับจัดการข้อความใน localStorage
const LOCAL_CHAT_KEY = "local_chat_messages"
const LOCAL_CHAT_ROOMS_KEY = "local_chat_rooms"

// ดึงข้อความแชทจาก localStorage
const getLocalChatMessages = (): ChatMessage[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(LOCAL_CHAT_KEY)
    const messages = stored ? JSON.parse(stored) : []
    return messages.map((msg: any) => ({
      ...msg,
      createdAt: new Date(msg.createdAt),
      isLocal: true,
    }))
  } catch (error) {
    console.error("Error getting local chat messages:", error)
    return []
  }
}

// บันทึกข้อความแชทลงใน localStorage
const saveLocalChatMessage = (message: Omit<ChatMessage, "createdAt" | "id">) => {
  if (typeof window === "undefined") return { success: false }
  try {
    const messages = getLocalChatMessages()
    const newMessage = {
      ...message,
      id: `local_${Date.now()}`,
      createdAt: new Date(),
      isLocal: true,
    }
    messages.push(newMessage)
    localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(messages))
    console.log("Message saved locally:", newMessage)
    return { id: newMessage.id, success: true, source: "local" }
  } catch (error) {
    console.error("Error saving local chat message:", error)
    return { success: false, error: "ไม่สามารถบันทึกข้อความได้" }
  }
}

// ดึงห้องแชทจาก localStorage
const getLocalChatRooms = (): ChatRoom[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(LOCAL_CHAT_ROOMS_KEY)
    const rooms = stored ? JSON.parse(stored) : []
    return rooms.map((room: any) => ({
      ...room,
      createdAt: new Date(room.createdAt),
      lastActivity: new Date(room.lastActivity),
      isLocal: true,
    }))
  } catch (error) {
    console.error("Error getting local chat rooms:", error)
    return []
  }
}

// บันทึกห้องแชทลงใน localStorage
const saveLocalChatRoom = (roomData: Omit<ChatRoom, "id" | "createdAt" | "lastActivity" | "activeUsers">) => {
  if (typeof window === "undefined") return { success: false }
  try {
    const rooms = getLocalChatRooms()
    const newRoom = {
      ...roomData,
      id: `local_${Date.now()}`,
      createdAt: new Date(),
      lastActivity: new Date(),
      activeUsers: 1,
      isLocal: true,
    }
    rooms.push(newRoom)
    localStorage.setItem(LOCAL_CHAT_ROOMS_KEY, JSON.stringify(rooms))
    console.log("Room saved locally:", newRoom)
    return { id: newRoom.id, success: true, source: "local" }
  } catch (error) {
    console.error("Error saving local chat room:", error)
    return { success: false, error: "ไม่สามารถบันทึกห้องแชทได้" }
  }
}

// ตรวจสอบว่าผู้ใช้มีชื่อหรือไม่
export const getUserDisplayName = () => {
  // ถ้าเป็นแอดมิน
  const currentUser = getCurrentUser()
  if (currentUser?.email) {
    return currentUser.email.split("@")[0]
  }

  // ถ้าเป็นแอดมินในโหมดทดลอง
  if (isDemoAdmin()) {
    return "แอดมิน (ทดลอง)"
  }

  // ถ้าเคยตั้งชื่อไว้ใน localStorage
  if (typeof window !== "undefined") {
    const storedName = localStorage.getItem("chat_user_name")
    if (storedName) return storedName
  }

  return ""
}

// บันทึกชื่อผู้ใช้ลงใน localStorage
export const saveUserDisplayName = (name: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("chat_user_name", name)
  }
}

// ตั้งเวลาตรวจสอบและลบห้องที่ไม่มีกิจกรรมทุก 5 นาที
export const setupRoomCleanupInterval = () => {
  if (typeof window !== "undefined") {
    console.log("Setting up room cleanup interval")

    // ทำความสะอาดทันทีเมื่อโหลดหน้า แต่ใช้ try-catch เพื่อจัดการข้อผิดพลาด
    try {
      cleanupInactiveRooms().catch((error) => {
        console.error("Error during initial room cleanup:", error)
      })
    } catch (error) {
      console.error("Failed to run initial room cleanup:", error)
    }

    // ตั้งเวลาทำความสะอาดทุก 5 นาที
    const interval = setInterval(
      () => {
        try {
          cleanupInactiveRooms().catch((error) => {
            console.error("Error during scheduled room cleanup:", error)
          })
        } catch (error) {
          console.error("Failed to run scheduled room cleanup:", error)
        }
      },
      5 * 60 * 1000,
    )

    return interval
  }
  return null
}
