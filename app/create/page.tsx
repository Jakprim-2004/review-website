import { redirect } from "next/navigation"

// หน้านี้จะทำการ redirect ไปยังหน้าที่ถูกต้อง
export default function CreatePage() {
  redirect("/write")
  return null
}
