import { supabase } from '../lib/supabase';

/**
 * Supabase User Service
 * Handles all user-related database operations
 */

export const UserService = {
    /**
     * Get user by ID
     */
    async getUser(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    },

    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user by email:', error);
            return null;
        }
    },

    /**
     * Create new user
     */
    async createUser(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    id: userData.id,
                    email: userData.email,
                    name: userData.name,
                    avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=EA580C&color=fff&size=256`,
                    motorcycle: userData.motorcycle || {},
                    level: 1,
                    xp: 0,
                    location: userData.location || null,
                    details: userData.details || {},
                    is_admin: userData.email === 'agm_jr@outlook.com'
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    /**
     * Update user profile
     */
    async updateUser(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    /**
     * Add XP to user
     */
    async addXP(userId, xpAmount, reason) {
        try {
            // Get current user data
            const user = await this.getUser(userId);
            if (!user) throw new Error('User not found');

            const newXp = user.xp + xpAmount;
            const newLevel = Math.floor(newXp / 1000) + 1;

            // Update user
            const updatedUser = await this.updateUser(userId, {
                xp: newXp,
                level: newLevel
            });

            // Log activity
            await this.logActivity(userId, 'xp_gain', `Ganhou ${xpAmount} XP: ${reason}`, {
                xp_amount: xpAmount,
                reason
            });

            return {
                user: updatedUser,
                leveledUp: newLevel > user.level,
                previousLevel: user.level,
                newLevel
            };
        } catch (error) {
            console.error('Error adding XP:', error);
            throw error;
        }
    },

    /**
     * Log user activity
     */
    async logActivity(userId, type, description, metadata = {}) {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .insert([{
                    user_id: userId,
                    type,
                    description,
                    metadata
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error logging activity:', error);
            return null;
        }
    },

    /**
     * Get user activity logs
     */
    async getActivityLogs(userId, limit = 50) {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            return [];
        }
    },

    /**
     * Get all users (for admin/leaderboard)
     */
    async getAllUsers(limit = 100) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, avatar, level, xp, location, motorcycle, routes_completed, events_attended')
                .order('xp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching all users:', error);
            return [];
        }
    }
};
