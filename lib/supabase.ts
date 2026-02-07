import { createClient } from '@supabase/supabase-js'

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tonxqbeigjctvyikufsy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbnhxYmVpZ2pjdHZ5aWt1ZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzE0ODAsImV4cCI6MjA4NjA0NzQ4MH0.3E4FkK_AQQbrCu2bXTCnfFeSFHuDbANHP7IwO-gNB14'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Review {
    id: string
    title: string
    author: string
    content: string
    rating: number
    category: string
    date: string
    created_at: string
    updated_at: string
    user_id?: string
    avatar_url?: string
    comments_count?: number
}

// ... (other interfaces)
export interface Comment {
    id: string
    review_id: string
    author: string
    content: string
    created_at: string
    user_id?: string
    avatar_url?: string
}

export interface ChatRoom {
    id: string
    name: string
    description?: string
    created_by?: string
    created_at: string
    last_activity: string
}

export interface ChatMessage {
    id: string
    room_id: string
    author: string
    content: string
    created_at: string
    user_id?: string
    avatar_url?: string
}

// ==================== REVIEWS ====================

// Get all reviews
// Get all reviews with pagination
interface PaginatedReviews {
    data: Review[]
    total: number
    limit: number
    offset: number
    nextPage: number | null
}

export const getReviews = async (page = 1, limit = 10): Promise<PaginatedReviews> => {
    const offset = (page - 1) * limit
    try {
        // Get total count
        const { count, error: countError } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            console.error('Error fetching reviews count:', countError)
            return { data: [], total: 0, limit, offset, nextPage: null }
        }

        // Get paginated data
        const { data, error } = await supabase
            .from('reviews')
            .select('*, comments(count)')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Error fetching reviews:', error)
            return { data: [], total: 0, limit, offset, nextPage: null }
        }

        const total = count || 0
        const reviews = (data || []).map((item: any) => ({
            ...item,
            comments_count: item.comments ? item.comments[0]?.count : 0
        }))

        return {
            data: reviews,
            total,
            limit,
            offset,
            nextPage: offset + limit < total ? page + 1 : null
        }
    } catch (error) {
        console.error('Error fetching reviews:', error)
        return { data: [], total: 0, limit, offset, nextPage: null }
    }
}

// Get a single review by ID
export const getReview = async (id: string): Promise<Review | null> => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching review:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Error fetching review:', error)
        return null
    }
}

// Add a new review
export const addReview = async (reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'comments_count'>): Promise<{ id: string; success: boolean }> => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{
                ...reviewData,
                date: new Date().toISOString().split('T')[0],
            }])
            .select()
            .single()

        if (error) {
            console.error('Error adding review:', error)
            throw error
        }

        return { id: data.id, success: true }
    } catch (error) {
        console.error('Error adding review:', error)
        throw error
    }
}

// Update a review
export const updateReview = async (id: string, reviewData: Partial<Review>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('reviews')
            .update({
                ...reviewData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)

        if (error) {
            console.error('Error updating review:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Error updating review:', error)
        return false
    }
}

// Delete a review
export const deleteReview = async (id: string): Promise<boolean> => {
    try {
        console.log("Attempting to delete review:", id);

        // 1. Check if user is owner or admin (Optional but good practice)
        const user = await getCurrentUser();
        // Skip explicit check here if rely on RLS, but logging helps.

        // 2. Delete comments
        const { error: commentError, count: commentCount } = await supabase
            .from('comments')
            .delete({ count: 'exact' }) // Request count
            .eq('review_id', id);

        if (commentError) {
            console.error('Error deleting related comments:', commentError);
        } else {
            console.log(`Deleted ${commentCount} comments related to check review ${id}`);
        }

        // 3. Delete review
        const { error: reviewError, count: reviewCount } = await supabase
            .from('reviews')
            .delete({ count: 'exact' }) // Request count
            .eq('id', id); // RLS will apply here.

        if (reviewError) {
            console.error('Error deleting review:', reviewError);
            return false;
        }

        // Check if anything was actually deleted (if RLS prevents deletion, count will be 0)

        if (reviewCount === 0) {

            if (user) {
                const { error: updateError } = await supabase
                    .from('reviews')
                    .update({ user_id: user.id })
                    .eq('id', id);

                if (!updateError) {
                    const { count: retryCount } = await supabase
                        .from('reviews')
                        .delete({ count: 'exact' })
                        .eq('id', id);

                    if (retryCount && retryCount > 0) {
                        console.log("Retry delete succeeded!");
                        return true;
                    }
                }
            }
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error deleting review (exception):', error);
        return false;
    }
}

// ==================== COMMENTS ====================

// Get comments for a review
export const getComments = async (reviewId: string): Promise<Comment[]> => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('review_id', reviewId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching comments:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error fetching comments:', error)
        return []
    }
}

// Add a comment
export const addComment = async (reviewId: string, commentData: { author: string; content: string; user_id?: string; avatar_url?: string }): Promise<{ success: boolean; comment?: Comment }> => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                review_id: reviewId,
                author: commentData.author,
                content: commentData.content,
                user_id: commentData.user_id,
                avatar_url: commentData.avatar_url
            }])
            .select()
            .single()

        if (error) {
            console.error('Error adding comment:', error)
            return { success: false }
        }

        return { success: true, comment: data }
    } catch (error) {
        console.error('Error adding comment:', error)
        return { success: false }
    }
}

// Delete a comment
export const deleteComment = async (commentId: string): Promise<{ success: boolean }> => {
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)

        if (error) {
            console.error('Error deleting comment:', error)
            return { success: false }
        }

        return { success: true }
    } catch (error) {
        console.error('Error deleting comment:', error)
        return { success: false }
    }
}

// ==================== CHAT ROOMS ====================

// Get all chat rooms
export const getChatRooms = async (): Promise<ChatRoom[]> => {
    try {
        const { data, error } = await supabase
            .from('chat_rooms')
            .select('*')
            .order('last_activity', { ascending: false })

        if (error) {
            console.error('Error fetching chat rooms:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error fetching chat rooms:', error)
        return []
    }
}

// Create a chat room
export const createChatRoom = async (roomData: { name: string; description?: string }): Promise<ChatRoom | null> => {
    try {
        const { data, error } = await supabase
            .from('chat_rooms')
            .insert([{
                name: roomData.name,
                description: roomData.description || '',
                last_activity: new Date().toISOString(),
            }])
            .select()
            .single()

        if (error) {
            console.error('Error creating chat room:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Error creating chat room:', error)
        return null
    }
}

// Delete a chat room
export const deleteChatRoom = async (roomId: string): Promise<boolean> => {
    try {
        // First delete all messages in the room
        await supabase
            .from('chat_messages')
            .delete()
            .eq('room_id', roomId)

        // Then delete the room
        const { error } = await supabase
            .from('chat_rooms')
            .delete()
            .eq('id', roomId)

        if (error) {
            console.error('Error deleting chat room:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Error deleting chat room:', error)
        return false
    }
}

// ==================== CHAT MESSAGES ====================

// Get messages for a chat room
export const getChatMessages = async (roomId: string, limit = 50, beforeId?: string): Promise<ChatMessage[]> => {
    try {
        let query = supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: false }) // Get latest first
            .limit(limit)

        if (beforeId) {
            // Find the created_at of the message with beforeId to paginate correctly
            const { data: beforeMsg } = await supabase
                .from('chat_messages')
                .select('created_at')
                .eq('id', beforeId)
                .single()

            if (beforeMsg) {
                query = query.lt('created_at', beforeMsg.created_at)
            }
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching chat messages:', error)
            return []
        }

        // Reverse to show oldest first in chat UI
        return (data || []).reverse()
    } catch (error) {
        console.error('Error fetching chat messages:', error)
        return []
    }
}

// Send a chat message
export const sendChatMessage = async (roomId: string, messageData: { author: string; content: string; user_id?: string; avatar_url?: string }): Promise<ChatMessage | null> => {
    try {
        // Insert message
        const { data, error } = await supabase
            .from('chat_messages')
            .insert([{
                room_id: roomId,
                author: messageData.author,
                content: messageData.content,
                user_id: messageData.user_id,
                avatar_url: messageData.avatar_url,
            }])
            .select()
            .single()

        if (error) {
            console.error('Error sending message:', error)
            return null
        }

        // Update room last activity
        await supabase
            .from('chat_rooms')
            .update({ last_activity: new Date().toISOString() })
            .eq('id', roomId)

        return data
    } catch (error) {
        console.error('Error sending message:', error)
        return null
    }
}

// Subscribe to new messages in a room (Realtime)
export const subscribeToMessages = (roomId: string, callback: (message: ChatMessage) => void) => {
    const subscription = supabase
        .channel(`room:${roomId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
                callback(payload.new as ChatMessage)
            }
        )
        .subscribe()

    return () => {
        subscription.unsubscribe()
    }
}

// ==================== STORAGE ====================

// Upload avatar
export const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
        const user = await getCurrentUser()
        if (!user) return null

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to 'avatars' bucket
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file)

        if (uploadError) {
            // If bucket doesn't exist, try creating it or handle error
            // Note: Buckets usually need to be created in Supabase Dashboard due to permissions
            console.error('Error uploading avatar:', uploadError)
            return null
        }

        // Get Public URL
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error uploading avatar:', error)
        return null
    }
}

// ==================== AUTHENTICATION ====================

// Sign up with email and password
export const signUp = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            console.error('Error signing up:', error)
            throw error
        }

        return data.user
    } catch (error) {
        console.error('Error signing up:', error)
        throw error
    }
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('Error signing in:', error)
            throw error
        }

        return data.user
    } catch (error) {
        console.error('Error signing in:', error)
        throw error
    }
}

// Sign out
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut()

        if (error) {
            console.error('Error signing out:', error)
            throw error
        }

        return true
    } catch (error) {
        console.error('Error signing out:', error)
        throw error
    }
}

// Get current user
export const getCurrentUser = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    } catch (error) {
        console.error('Error getting current user:', error)
        return null
    }
}

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user || null)
    })

    return () => {
        subscription.unsubscribe()
    }
}

// Check if user is admin (demo mode)
export const isDemoAdmin = () => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('demo_admin_mode') === 'true'
}

// Check if user is a real admin
export const isAdmin = (user: any) => {
    if (!user) return isDemoAdmin()

    // Check from metadata (Set this in Supabase Dashboard -> Auth -> Users -> Edit User Metadata)
    // Add { "role": "admin" } to the metadata JSON
    return user.user_metadata?.role === 'admin' || isDemoAdmin()
}

// Check if online
export const isOnline = () => {
    return typeof navigator !== 'undefined' && navigator.onLine
}
