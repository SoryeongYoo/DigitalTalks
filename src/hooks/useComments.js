// src/hooks/useComments.js
import { useEffect, useState } from 'react';
import { db } from '../firebase.js';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';

export function useComments(postId) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (postId === undefined || postId === null) return;

    const pid = String(postId).trim();
    const colRef = collection(db, 'posts', pid, 'comments');

    // 1) 첫 로딩 한 번: 경로/권한 점검 + 초기 데이터 채우기
    (async () => {
      try {
        const snap = await getDocs(colRef);
        const base = snap.docs.map((d) => mapDoc(d));
        setComments(sortSafe(base));
        // 콘솔 확인용
        console.log('[comments.initial]', `posts/${pid}/comments`, base.length);
      } catch (err) {
        console.error('[comments.initial] error', err);
      }
    })();

    // 2) 실시간 구독 (orderBy 없이 전체 구독)
    const unsub = onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snap) => {
        const list = snap.docs.map((d) => mapDoc(d));
        // pending write로 createdAt이 비어 있어도 사라지지 않게 정렬/유지
        setComments(sortSafe(list));
        console.log('[comments.snap]', `posts/${pid}/comments`, list.length, 'pending:', snap.metadata.hasPendingWrites);
      },
      (err) => {
        console.error('[comments.snap] error', err);
        // 여기서 배열을 비우지 말자 (깜빡임/증발 방지)
      }
    );

    return () => unsub();
  }, [postId]);

  return comments;
}

// ---------- helpers ----------
function mapDoc(d) {
  const data = d.data() || {};
  // Timestamp → Date (없으면 null)
  const createdAt =
    data.createdAt?.toDate?.() ??
    (data.createdAt instanceof Date ? data.createdAt : null);

  return {
    id: d.id,
    text: data.text ?? '',
    user: data.user ?? data.username ?? '익명',
    profileImage: data.profileImage || null,
    createdAt, // Date | null
  };
}

// createdAt 없으면 맨 뒤, 그다음 doc.id로 안정 정렬
function sortSafe(arr) {
  return [...arr].sort((a, b) => {
    const at = a.createdAt ? a.createdAt.getTime() : -1;
    const bt = b.createdAt ? b.createdAt.getTime() : -1;
    if (at !== bt) return at - bt;
    return a.id.localeCompare(b.id);
  });
}
