import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabase.js';

export function useWallPosts() {
  const [posts, setPosts] = useState([]);
  const seenIds = useRef(new Set());

  const addPost = useCallback((post) => {
    if (seenIds.current.has(post.id)) return;
    seenIds.current.add(post.id);
    setPosts((prev) => {
      if (prev.some((p) => p.id === post.id)) return prev;
      return [post, ...prev];
    });
  }, []);

  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  // Fetch initial posts
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach((p) => seenIds.current.add(p.id));
        setPosts(data);
      }
    };
    fetchPosts();
  }, []);

  // Subscribe to Realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          addPost(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          removePost(payload.old.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addPost, removePost]);

  return { posts, removePost };
}
