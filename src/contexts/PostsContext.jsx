// 게시물 context
import React, { createContext, useState, useCallback, useEffect, useContext, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { db } from '../firebase.js';
import { runTransaction, addDoc, collection, doc, serverTimestamp, setDoc, increment, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, listAll } from 'firebase/storage';

export const PostsContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]); // 🔹 초기값을 빈 배열로
  const { currentUser } = useAuth();
  const storage = getStorage();

  // 스토리지에서 모든 이미지 URL 가져오기 함수
  const getAllImageUrls = useCallback(async () => {
    const possiblePaths = [
      '', // 루트 디렉토리
      'images/',
      'posts/',
      'uploads/',
      'media/',
      'pictures/'
    ];

    for (const path of possiblePaths) {
      try {
        console.log(`스토리지 경로 확인 중: ${path || '루트'}`);
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);
        
        console.log(`경로 "${path}" 결과:`, {
          items: result.items.length,
          prefixes: result.prefixes.length,
          itemNames: result.items.map(item => item.name)
        });

        // 서브 폴더가 있으면 출력
        if (result.prefixes.length > 0) {
          console.log(`서브 폴더들:`, result.prefixes.map(prefix => prefix.name));
        }
        
        if (result.items.length > 0) {
          console.log(`"${path}" 경로에서 ${result.items.length}개 파일 발견!`);
          
          const urlPromises = result.items.map(async (itemRef) => {
            try {
              const url = await getDownloadURL(itemRef);
              console.log(`URL 생성 성공: ${itemRef.name} -> ${url.substring(0, 50)}...`);
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
    
    console.error('모든 경로에서 이미지를 찾을 수 없습니다.');
    return [];
  }, [storage]);

  // 랜덤 이미지 URL 선택 함수
  const getRandomImageUrl = useCallback((imageUrls) => {
    // 스토리지에 이미지가 없으면 더미 이미지 사용
    if (imageUrls.length === 0) {
      const dummyImages = [
        'https://picsum.photos/400/400?random=1',
        'https://picsum.photos/400/400?random=2',
        'https://picsum.photos/400/400?random=3',
        'https://picsum.photos/400/400?random=4',
        'https://picsum.photos/400/400?random=5',
      ];
      const randomIndex = Math.floor(Math.random() * dummyImages.length);
      return dummyImages[randomIndex];
    }
    
    const randomIndex = Math.floor(Math.random() * imageUrls.length);
    return imageUrls[randomIndex];
  }, []);

  useEffect(() => {
    const colRef = collection(db, 'posts');

    // 실시간 업데이트를 위해 onSnapshot 사용
    const unsub = onSnapshot(
      colRef,
      async (snap) => {
        try {
          // 먼저 모든 이미지 URL 가져오기
          const allImageUrls = await getAllImageUrls();
          console.log('가져온 이미지 URLs:', allImageUrls);

          // firestore에서 데이터 읽기
          const list = await Promise.all(
            snap.docs.map(async (d) => {
              const data = d.data();
              
              let imageUrl = null;
              
              // 방법 1: 기존 이미지 경로가 있는 경우
              if (data.imagePath) {
                try {
                  const storageRef = ref(storage, data.imagePath);
                  imageUrl = await getDownloadURL(storageRef);
                } catch (error) {
                  console.error('기존 이미지 다운로드 실패:', error);
                  // 실패 시 랜덤 이미지 사용
                  imageUrl = getRandomImageUrl(allImageUrls);
                }
              }
              // 방법 2: 이미지 URL이 직접 저장된 경우
              else if (data.imageUrl) {
                imageUrl = data.imageUrl;
              }
              // 방법 3: 이미지가 없거나 실패한 경우 랜덤 이미지 사용
              else {
                imageUrl = getRandomImageUrl(allImageUrls);
              }

              return {
                id: d.id, // 문서 ID = postId
                content: data.content ?? '',
                image: imageUrl,
                imageUrl: imageUrl, // 호환성을 위해 두 필드 모두 설정
                profileImage: data.profileImage || null,
                commentCount: data.comment_count ?? data.commentCount ?? 0,
                instagram_id: data.instagram_id ?? '',
                timeAgo: data.timeAgo || '방금 전', // timeAgo 추가
                likes: data.likes || 0, // likes 필드 추가
                isLiked: data.isLiked || false, // isLiked 필드 추가
                user: {
                  name: data.instagram_id ?? data.user ?? '익명',
                  username: data.instagram_id ?? data.user ?? '익명',
                  avatar: data.profileImage || null
                },
              };
            })
          );
          
          setPosts(list);
        } catch (error) {
          console.error('게시물 데이터 처리 실패:', error);
        }
      },
      (err) => console.error('[posts onSnapshot]', err)
    );

    return () => unsub();
  }, [getAllImageUrls, getRandomImageUrl, storage]);

  // 게시물 좋아요 토글 함수
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

      // 문서가 없어도 생성 + commentCount 증가
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
          // 1) 현재 카운트 읽기 (둘 중 있는 값 우선)
          const postSnap = await tx.get(postRef);
          const cur =
            Number(
              (postSnap.exists() && (postSnap.data().comment_count ?? postSnap.data().commentCount))
            ) || 0;

          // 2) 댓글 삭제 + 카운트 동기화(음수 방지)
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

  return (
    <PostsContext.Provider
      value={{
        posts,
        toggleLike,
        addComment,
        deleteComment
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};