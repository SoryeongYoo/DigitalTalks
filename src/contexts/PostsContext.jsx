import React, { createContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { db } from '../firebase.js';
import { runTransaction, addDoc, collection, doc, serverTimestamp, setDoc, increment, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, listAll } from 'firebase/storage';

export const PostsContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const { currentUser } = useAuth();
  
  // storage 인스턴스를 한 번만 생성
  const storage = useMemo(() => getStorage(), []);

  // 🔥 함수들을 useCallback으로 안정화 (의존성 최소화)
  const getAllImageUrls = useCallback(async () => {
    const possiblePaths = [
      '', 'images/', 'posts/', 'uploads/', 'media/', 'pictures/'
    ];

    for (const path of possiblePaths) {
      try {
        console.log(`스토리지 경로 확인 중: ${path || '루트'}`);
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);
        
        if (result.items.length > 0) {
          console.log(`"${path}" 경로에서 ${result.items.length}개 파일 발견!`);
          
          const urlPromises = result.items.map(async (itemRef) => {
            try {
              const url = await getDownloadURL(itemRef);
              return url;
            } catch (error) {
              console.error(`이미지 URL 가져오기 실패: ${itemRef.fullPath}`, error);
              return null;
            }
          });
          
          const urls = await Promise.all(urlPromises);
          const validUrls = urls.filter(url => url !== null);
          
          if (validUrls.length > 0) {
            console.log(`최종 ${validUrls.length}개 이미지 URL 확보!`);
            return validUrls;
          }
        }
      } catch (error) {
        console.log(`경로 "${path}" 접근 실패:`, error.message);
        continue;
      }
    }
    
    console.log('스토리지에서 이미지를 찾을 수 없어 더미 이미지 사용');
    return [];
  }, [storage]); // storage만 의존성으로

  // 🔥 더미 이미지 배열을 상수로 분리
  const DUMMY_IMAGES = useMemo(() => [
    'https://picsum.photos/400/400?random=1',
    'https://picsum.photos/400/400?random=2',
    'https://picsum.photos/400/400?random=3',
    'https://picsum.photos/400/400?random=4',
    'https://picsum.photos/400/400?random=5',
  ], []);

  const getRandomImageUrl = useCallback((imageUrls) => {
    if (imageUrls.length === 0) {
      const randomIndex = Math.floor(Math.random() * DUMMY_IMAGES.length);
      return DUMMY_IMAGES[randomIndex];
    }
    
    const randomIndex = Math.floor(Math.random() * imageUrls.length);
    return imageUrls[randomIndex];
  }, [DUMMY_IMAGES]); // DUMMY_IMAGES만 의존성으로

  // 🔥 Firebase 구독을 한 번만 실행하도록 최적화
  useEffect(() => {
    let isMounted = true; // 컴포넌트 마운트 상태 추적
    
    const colRef = collection(db, 'posts');
    console.log('[PostsContext] Firebase 구독 시작');

    const unsub = onSnapshot(
      colRef,
      async (snap) => {
        if (!isMounted) return; // 언마운트된 경우 처리 중단
        
        try {
          console.log('[PostsContext] 데이터 업데이트 받음:', snap.docs.length, '개');
          
          // 🔥 이미지 URL은 한 번만 가져오기
          const allImageUrls = await getAllImageUrls();
          
          if (!isMounted) return; // 비동기 작업 후 다시 확인

          const list = await Promise.all(
            snap.docs.map(async (d) => {
              const data = d.data();
              
              let imageUrl = null;
              
              if (data.imagePath) {
                try {
                  const storageRef = ref(storage, data.imagePath);
                  imageUrl = await getDownloadURL(storageRef);
                } catch (error) {
                  console.error('기존 이미지 다운로드 실패:', error);
                  imageUrl = getRandomImageUrl(allImageUrls);
                }
              } else if (data.imageUrl) {
                imageUrl = data.imageUrl;
              } else {
                imageUrl = getRandomImageUrl(allImageUrls);
              }

              return {
                id: d.id,
                content: data.content ?? '',
                image: imageUrl,
                imageUrl: imageUrl,
                profileImage: data.profileImage || null,
                commentCount: data.comment_count ?? data.commentCount ?? 0,
                instagram_id: data.instagram_id ?? '',
                timeAgo: data.timeAgo || '방금 전',
                likes: data.likes || 0,
                isLiked: data.isLiked || false,
                user: {
                  name: data.instagram_id ?? data.user ?? '익명',
                  username: data.instagram_id ?? data.user ?? '익명',
                  avatar: data.profileImage || null
                },
              };
            })
          );
          
          if (isMounted) {
            setPosts(list);
            setIsLoading(false); // 첫 로딩 완료
            console.log('[PostsContext] 포스트 설정 완료:', list.length, '개');
          }
        } catch (error) {
          console.error('게시물 데이터 처리 실패:', error);
          if (isMounted) {
            setIsLoading(false);
          }
        }
      },
      (err) => {
        console.error('[posts onSnapshot]', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log('[PostsContext] Firebase 구독 해제');
      isMounted = false;
      unsub();
    };
  }, []); // 🔥 의존성 배열 비움으로 한 번만 실행

  // 🔥 액션 함수들도 안정화
  const toggleLike = useCallback((postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          }
          : post
      )
    );
  }, []);

  const addComment = useCallback(
    async (postId, text) => {
      if (!text?.trim() || !currentUser) return;

      const pid = String(postId);

      const payload = {
        userId: currentUser.uid ?? currentUser.id ?? '',
        user: currentUser.username ?? '익명',
        profileImage: currentUser.profileImage ?? '',
        text: text.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'posts', pid, 'comments'), payload);
      await setDoc(
        doc(db, 'posts', pid),
        { comment_count: increment(1) },
        { merge: true }
      );
    },
    [currentUser]
  );

  const deleteComment = useCallback(
    async (postId, commentId) => {
      if (!postId || !commentId) return;

      const pid = String(postId);
      const postRef = doc(db, 'posts', pid);
      const commentRef = doc(db, 'posts', pid, 'comments', String(commentId));

      try {
        await runTransaction(db, async (tx) => {
          const postSnap = await tx.get(postRef);
          const cur =
            Number(
              (postSnap.exists() && (postSnap.data().comment_count ?? postSnap.data().commentCount))
            ) || 0;

          const next = Math.max(0, cur - 1);
          tx.delete(commentRef);
          tx.set(postRef, { comment_count: next, commentCount: next }, { merge: true });
        });
      } catch (e) {
        console.error('deleteComment 실패:', e);
      }
    },
    []
  );

  // 🔥 Context value를 useMemo로 안정화
  const contextValue = useMemo(() => ({
    posts,
    isLoading,
    toggleLike,
    addComment,
    deleteComment
  }), [posts, isLoading, toggleLike, addComment, deleteComment]);

  return (
    <PostsContext.Provider value={contextValue}>
      {children}
    </PostsContext.Provider>
  );
};