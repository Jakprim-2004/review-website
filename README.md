# ReviewCSC Hub

แพลตฟอร์มสำหรับแบ่งปันและพูดคุยเกี่ยวกับรีวิวต่างๆ พร้อมระบบแชทแบบเรียลไทม์

## ✨ คุณสมบัติหลัก

### 📝 ระบบรีวิว
- **เขียนรีวิว**: สร้างรีวิวใหม่พร้อมระบบให้คะแนน 1-5 ดาว
- **หมวดหมู่**: จัดหมวดหมู่รีวิว (ร้านอาหาร, คาเฟ่, เทคโนโลยี, ท่องเที่ยว, หอพัก, ที่อยู่ ฯลฯ)
- **ค้นหา**: ค้นหารีวิวตามชื่อ, เนื้อหา, หรือผู้เขียน
- **กรองข้อมูล**: กรองรีวิวตามหมวดหมู่
- **ความคิดเห็น**: แสดงความคิดเห็นในแต่ละรีวิว

### 💬 ระบบแชทเรียลไทม์
- **ห้องแชท**: สร้างและเข้าร่วมห้องแชทต่างๆ
- **แชทเรียลไทม์**: พูดคุยแบบเรียลไทม์ผ่าน Firebase
- **จัดการห้อง**: ระบบลบห้องที่ไม่มีกิจกรรมอัตโนมัติ
- **ออฟไลน์**: รองรับการใช้งานแบบออฟไลน์

### 🛡️ ระบบผู้ดูแล
- **เข้าสู่ระบบ**: ระบบยืนยันตัวตนผ่าน Firebase Auth
- **โหมดทดลอง**: ทดลองใช้งานโดยไม่ต้องลงทะเบียน
- **จัดการรีวิว**: ดู, ลบ, และจัดการรีวิวทั้งหมด
- **ค้นหา**: ค้นหารีวิวในระบบผู้ดูแล

### 🔄 ระบบออฟไลน์
- **Local Storage**: เก็บข้อมูลในเครื่องเมื่อไม่มีการเชื่อมต่อ
- **Sync**: ซิงค์ข้อมูลเมื่อกลับมาออนไลน์
- **Fallback**: ใช้ข้อมูลตัวอย่างเมื่อไม่สามารถเชื่อมต่อได้

## 🚀 เทคโนโลยีที่ใช้

### Frontend
- **Next.js 15** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components
- **Lucide React** - Icons

### Backend & Database
- **Firebase Firestore** - NoSQL Database
- **Firebase Auth** - Authentication
- **Firebase Hosting** - Deployment

### State Management
- **React Hooks** - Local State
- **Firebase Realtime** - Real-time Updates
- **Local Storage** - Offline Storage

## 📁 โครงสร้างโปรเจค

```
reviewwebsite/
├── app/                          # Next.js App Router
│   ├── admin/                    # ระบบผู้ดูแล
│   │   ├── dashboard/           # หน้าแดชบอร์ด
│   │   └── login/               # หน้าเข้าสู่ระบบ
│   ├── chat/                    # ระบบแชท
│   ├── reviews/[id]/            # หน้ารายละเอียดรีวิว
│   ├── thai-review-website-X6zs2vzKiPR/  # หน้าสร้างรีวิว (URL ปลอดภัย)
│   ├── globals.css              # Global Styles
│   ├── layout.tsx               # Root Layout
│   └── page.tsx                 # หน้าหลัก
├── components/                   # React Components
│   ├── admin-link.tsx           # ลิงก์ผู้ดูแล
│   ├── chat/                    # คอมโพเนนต์แชท
│   │   ├── chat-box.tsx         # กล่องแชทหลัก
│   │   ├── message-list.tsx     # รายการข้อความ
│   │   ├── message-input.tsx    # ช่องพิมพ์ข้อความ
│   │   ├── room-list.tsx        # รายการห้องแชท
│   │   └── create-room-dialog.tsx # ไดอะล็อกสร้างห้อง
│   ├── theme-provider.tsx       # Theme Provider
│   └── ui/                      # shadcn/ui Components
├── lib/                         # Utilities & APIs
│   ├── firebase.ts              # Firebase Configuration
│   ├── chat.ts                  # Chat Functions
│   └── utils.ts                 # Utility Functions
├── hooks/                       # Custom Hooks
├── styles/                      # Additional Styles
└── public/                      # Static Assets
```

## 🛠️ การติดตั้งและใช้งาน

### 1. Clone Repository
\`\`\`bash
git clone <repository-url>
cd reviewwebsite
\`\`\`

### 2. ติดตั้ง Dependencies
\`\`\`bash
npm install
# หรือ
yarn install
\`\`\`

### 3. ตั้งค่า Firebase

#### 3.1 สร้างโปรเจค Firebase
1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. สร้างโปรเจคใหม่
3. เปิดใช้งาน Firestore Database
4. เปิดใช้งาน Authentication (Email/Password)

#### 3.2 ตั้งค่า Firestore Rules
ไปที่ Firestore Database > Rules และใส่กฎต่อไปนี้:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // อนุญาตให้อ่านรีวิวได้ทุกคน
    match /reviews/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // อนุญาตให้อ่านและเขียนแชทได้ทุกคน
    match /chats/{document=**} {
      allow read, write: if true;
    }
    
    // อนุญาตให้อ่านและเขียนห้องแชทได้ทุกคน
    match /chatrooms/{document=**} {
      allow read, write: if true;
    }
    
    // สำหรับคอลเลกชันอื่นๆ ต้องยืนยันตัวตน
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

#### 3.3 ตั้งค่า Firebase Config
แก้ไขไฟล์ \`lib/firebase.ts\` และใส่ค่า configuration ของคุณ:

\`\`\`typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
}
\`\`\`

### 4. สร้างผู้ดูแลระบบ
1. ไปที่ Firebase Console > Authentication
2. เพิ่มผู้ใช้ใหม่ด้วยอีเมลและรหัสผ่าน
3. ใช้ข้อมูลนี้เพื่อเข้าสู่ระบบผู้ดูแล

### 5. รันโปรเจค
\`\`\`bash
npm run dev
# หรือ
yarn dev
\`\`\`

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 📱 การใช้งาน

### สำหรับผู้ใช้ทั่วไป
1. **ดูรีวิว**: เข้าไปที่หน้าหลักเพื่อดูรีวิวทั้งหมด
2. **ค้นหา**: ใช้ช่องค้นหาหรือกรองตามหมวดหมู่
3. **เขียนรีวิว**: คลิก "เขียนรีวิวใหม่" เพื่อสร้างรีวิว
4. **แสดงความคิดเห็น**: เข้าไปในรีวิวเพื่อแสดงความคิดเห็น
5. **แชท**: ไปที่หน้าแชทเพื่อสร้างห้องหรือเข้าร่วมการสนทนา

### สำหรับผู้ดูแล
1. **เข้าสู่ระบบ**: ไปที่ `/admin/login`
2. **โหมดทดลอง**: ใช้โหมดทดลองโดยไม่ต้องลงทะเบียน
3. **จัดการรีวิว**: ดู, ค้นหา, และลบรีวิวในแดชบอร์ด
4. **ลบความคิดเห็น**: ลบความคิดเห็นที่ไม่เหมาะสม

## 🔧 การปรับแต่ง

### เปลี่ยนสีธีม
แก้ไขไฟล์ \`app/globals.css\` หรือ \`tailwind.config.ts\`

### เพิ่มหมวดหมู่ใหม่
แก้ไขอาร์เรย์ \`categories\` ในไฟล์:
- \`app/page.tsx\` (หน้าหลัก)
- \`app/thai-review-website-X6zs2vzKiPR/page.tsx\` (หน้าสร้างรีวิว)

### ปรับแต่งระบบแชท
แก้ไขไฟล์ในโฟลเดอร์ \`lib/chat.ts\` และ \`components/chat/\`

## 🚀 การ Deploy

### Vercel (แนะนำ)
1. Push โค้ดไปยัง GitHub
2. เชื่อมต่อ Vercel กับ GitHub repository
3. ตั้งค่า Environment Variables (ถ้าจำเป็น)
4. Deploy

### Firebase Hosting
\`\`\`bash
npm run build
firebase deploy
\`\`\`

## 🐛 การแก้ไขปัญหา

### ปัญหา Firebase Index
หากเจอข้อผิดพลาดเกี่ยวกับ Index:
1. เปิด Developer Console (F12)
2. คลิกลิงก์ที่ขึ้นต้นด้วย \`https://console.firebase.google.com/\`
3. คลิก "Create index"

### ปัญหาการเชื่อมต่อ
- ตรวจสอบ Firebase Configuration
- ตรวจสอบ Firestore Rules
- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต

### ข้อมูลไม่แสดง
- ลองรีเฟรชหน้า
- ตรวจสอบ Console สำหรับ Error
- ตรวจสอบว่า Firebase Rules ถูกต้อง



**ReviewCSC Hub** - แพลตฟอร์มแชร์ประสบการณ์และรีวิว 🌟
\`\`\`
