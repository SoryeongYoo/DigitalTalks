// 게시물 훅
import { useContext } from 'react';
import { PostsContext } from '../contexts/PostsContext.jsx';

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts must be used within PostProvider');
  return context;
};
