
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Poll, PollOption, PollVote, PollComment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { realtimeCache } from '@/utils/realtimeCache';

export function usePolls() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (user?.householdId) {
      loadPolls();
      subscribeToPolls();
    } else {
      setIsLoading(false);
    }

    return () => {
      if (channelRef.current) {
        console.log('usePolls: Unsubscribing from real-time updates');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.householdId]);

  const loadPolls = async (skipCache = false) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('usePolls: Load already in progress, skipping');
      return;
    }

    try {
      loadingRef.current = true;
      const cacheKey = `polls_${user?.householdId}`;

      // Check cache first (unless explicitly skipped)
      if (!skipCache) {
        const cached = realtimeCache.get<Poll[]>(cacheKey);
        if (cached) {
          setPolls(cached);
          setIsLoading(false);
          return;
        }
      }

      console.log('usePolls: Loading polls');
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('household_id', user?.householdId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedPolls = data.map(poll => ({
          id: poll.id,
          householdId: poll.household_id,
          title: poll.title,
          description: poll.description,
          createdByUserId: poll.created_by_user_id,
          expiresAt: poll.expires_at,
          isActive: poll.is_active,
          createdAt: poll.created_at,
          updatedAt: poll.updated_at,
        }));
        
        setPolls(mappedPolls);
        
        // Cache the results for 5 seconds
        realtimeCache.set(cacheKey, mappedPolls, 5000);
      }
    } catch (error) {
      console.error('usePolls: Error loading polls:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const subscribeToPolls = () => {
    // Prevent duplicate subscriptions
    if (channelRef.current?.state === 'subscribed') {
      console.log('usePolls: Already subscribed to real-time updates');
      return;
    }

    console.log('usePolls: Subscribing to real-time poll updates');
    
    const channel = supabase
      .channel(`household:${user?.householdId}:polls`, {
        config: {
          broadcast: { self: false },
          private: false,
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls',
          filter: `household_id=eq.${user?.householdId}`,
        },
        () => {
          console.log('usePolls: Polls changed, reloading');
          
          // Throttle updates
          realtimeCache.throttle(
            `polls_reload_${user?.householdId}`,
            () => {
              realtimeCache.invalidate(`polls_${user?.householdId}`);
              loadPolls(true);
            },
            1500 // 1.5 second throttle
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const createPoll = async (title: string, description: string, options: string[], expiresAt?: string) => {
    try {
      console.log('usePolls: Creating poll:', title);
      if (!user?.householdId) throw new Error('No household');

      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          household_id: user.householdId,
          title,
          description,
          created_by_user_id: user.id,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create poll options
      const optionsData = options.map(option => ({
        poll_id: pollData.id,
        option_text: option,
        vote_count: 0,
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData);

      if (optionsError) throw optionsError;

      console.log('usePolls: Poll created successfully');
      
      // Invalidate cache
      realtimeCache.invalidate(`polls_${user?.householdId}`);
      
      return { data: pollData, error: null };
    } catch (error: any) {
      console.error('usePolls: Error creating poll:', error);
      return { data: null, error: error.message };
    }
  };

  const getPollOptions = async (pollId: string): Promise<PollOption[]> => {
    try {
      const cacheKey = `poll_options_${pollId}`;
      
      // Check cache first
      const cached = realtimeCache.get<PollOption[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const options = data.map(option => ({
        id: option.id,
        pollId: option.poll_id,
        optionText: option.option_text,
        voteCount: option.vote_count,
        createdAt: option.created_at,
      }));
      
      // Cache for 3 seconds
      realtimeCache.set(cacheKey, options, 3000);
      
      return options;
    } catch (error) {
      console.error('usePolls: Error loading poll options:', error);
      return [];
    }
  };

  const vote = async (pollId: string, optionId: string) => {
    try {
      console.log('usePolls: Voting on poll:', pollId, 'option:', optionId);
      if (!user) throw new Error('Not authenticated');

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        // Update existing vote
        const { error: deleteError } = await supabase
          .from('poll_votes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) throw deleteError;

        // Decrement old option vote count
        const { error: decrementError } = await supabase.rpc('decrement_vote_count', {
          option_uuid: existingVote.option_id,
        });

        if (decrementError) console.error('Error decrementing vote count:', decrementError);
      }

      // Insert new vote
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: user.id,
        });

      if (voteError) throw voteError;

      // Increment new option vote count
      const { error: incrementError } = await supabase.rpc('increment_vote_count', {
        option_uuid: optionId,
      });

      if (incrementError) console.error('Error incrementing vote count:', incrementError);

      console.log('usePolls: Vote recorded successfully');
      
      // Invalidate cache
      realtimeCache.invalidate(`poll_options_${pollId}`);
      
      return { error: null };
    } catch (error: any) {
      console.error('usePolls: Error voting:', error);
      return { error: error.message };
    }
  };

  const getUserVote = async (pollId: string): Promise<string | null> => {
    try {
      if (!user) return null;

      const { data, error } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();

      if (error) return null;
      return data?.option_id || null;
    } catch (error) {
      return null;
    }
  };

  const getPollComments = async (pollId: string): Promise<PollComment[]> => {
    try {
      const cacheKey = `poll_comments_${pollId}`;
      
      // Check cache first
      const cached = realtimeCache.get<PollComment[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('poll_comments')
        .select('*, users(id, name, photo_url)')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const comments = data.map(comment => ({
        id: comment.id,
        pollId: comment.poll_id,
        userId: comment.user_id,
        commentText: comment.comment_text,
        createdAt: comment.created_at,
        user: comment.users ? {
          id: comment.users.id,
          name: comment.users.name,
          photoUrl: comment.users.photo_url,
        } : undefined,
      }));
      
      // Cache for 3 seconds
      realtimeCache.set(cacheKey, comments, 3000);
      
      return comments;
    } catch (error) {
      console.error('usePolls: Error loading poll comments:', error);
      return [];
    }
  };

  const addComment = async (pollId: string, commentText: string) => {
    try {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('poll_comments')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          comment_text: commentText,
        });

      if (error) throw error;

      console.log('usePolls: Comment added successfully');
      
      // Invalidate cache
      realtimeCache.invalidate(`poll_comments_${pollId}`);
      
      return { error: null };
    } catch (error: any) {
      console.error('usePolls: Error adding comment:', error);
      return { error: error.message };
    }
  };

  return {
    polls,
    isLoading,
    createPoll,
    getPollOptions,
    vote,
    getUserVote,
    getPollComments,
    addComment,
    refreshPolls: () => loadPolls(true),
  };
}
