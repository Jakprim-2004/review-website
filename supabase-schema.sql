-- =============================================
-- REVIO - Supabase Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category TEXT NOT NULL DEFAULT 'ทั่วไป',
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CHAT ROOMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CHAT MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews(category);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_comments_review_id ON comments(review_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_activity ON chat_rooms(last_activity DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- REVIEWS POLICIES
-- =============================================

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

-- Anyone can insert reviews (for now, can be restricted to authenticated users later)
CREATE POLICY "Anyone can insert reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Only the author can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Only the author or admin can delete reviews
CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- COMMENTS POLICIES
-- =============================================

-- Anyone can read comments
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

-- Anyone can insert comments
CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Only the author can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- CHAT ROOMS POLICIES
-- =============================================

-- Anyone can read chat rooms
CREATE POLICY "Anyone can read chat rooms" ON chat_rooms
  FOR SELECT USING (true);

-- Anyone can create chat rooms
CREATE POLICY "Anyone can create chat rooms" ON chat_rooms
  FOR INSERT WITH CHECK (true);

-- Only the creator can delete their chat rooms
CREATE POLICY "Users can delete own chat rooms" ON chat_rooms
  FOR DELETE USING (auth.uid() = created_by);

-- Anyone can update chat rooms (for last_activity)
CREATE POLICY "Anyone can update chat rooms" ON chat_rooms
  FOR UPDATE USING (true);

-- =============================================
-- CHAT MESSAGES POLICIES
-- =============================================

-- Anyone can read chat messages
CREATE POLICY "Anyone can read chat messages" ON chat_messages
  FOR SELECT USING (true);

-- Anyone can send chat messages
CREATE POLICY "Anyone can send chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Only the author can delete their own messages
CREATE POLICY "Users can delete own messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on reviews
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- REALTIME
-- =============================================

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- =============================================
-- SAMPLE DATA (Optional - comment out in production)
-- =============================================

-- Insert sample reviews
INSERT INTO reviews (title, author, content, rating, category, date) VALUES
('ร้านอาหารบรรยากาศดีมาก', 'สมชาย', 'อาหารอร่อยมาก บริการดีเยี่ยม บรรยากาศสุดยอด แนะนำให้มาลองครับ!', 5, 'ร้านอาหาร', '2024-04-15'),
('รีวิวสมาร์ทโฟนรุ่นใหม่', 'สมหญิง', 'แบตเตอรี่ใช้งานได้นาน แต่กล้องยังไม่ค่อยดีเท่าที่ควร โดยรวมคุ้มค่ากับราคา', 4, 'เทคโนโลยี', '2024-04-10'),
('ร้านกาแฟน่านั่งมาก', 'มานี', 'บรรยากาศอบอุ่น กาแฟรสชาติดี ขนมอบสดใหม่อร่อยมาก!', 5, 'คาเฟ่', '2024-04-05'),
('หอพักใกล้มหาวิทยาลัย สะดวกสบาย', 'วิชัย', 'หอพักสะอาด มี รปภ. 24 ชม. ใกล้ร้านสะดวกซื้อและร้านอาหาร เดินทางสะดวก แนะนำสำหรับนักศึกษา', 4, 'หอพัก', '2024-05-20'),
('คอนโดใจกลางเมือง วิวสวย', 'นภา', 'ทำเลดีมาก ใกล้ BTS เดินทางสะดวก มีสิ่งอำนวยความสะดวกครบครัน สระว่ายน้ำวิวสวย', 5, 'ที่อยู่', '2024-06-10');

-- Insert a sample chat room
INSERT INTO chat_rooms (name, description) VALUES
('ห้องสนทนาทั่วไป', 'พูดคุยเรื่องทั่วไป');
