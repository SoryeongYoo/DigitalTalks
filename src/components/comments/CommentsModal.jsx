import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import styles from './CommentsModal.module.css';
import { useUI } from '../../hooks/useUI.js';
import { usePosts } from '../../hooks/usePost.js';
import { useComments } from '../../hooks/useComments.js';
import { X } from 'lucide-react';

export default function CommentsModal({ postId }) {
  const { openComments } = useUI();
  const { addComment, deleteComment } = usePosts();
  const comments = useComments(String(postId));

  // 입력/분석 상태
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null); // { is_safe: boolean, sentiment?: string, ... }
  const [isComposing, setIsComposing] = useState(false); // 한글 IME 조합 중인지
  const debounceTimer = useRef(null);
  const abortRef = useRef(null);

  // ESC로 닫기, 스크롤 잠금
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && openComments(null);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [openComments]);

  // FastAPI 호출
  const analyzeText = useCallback(async (value) => {
    if (!value.trim()) {
      setAnalysis(null);
      return;
    }
    // 이전 요청 취소
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // 분석 시작
    setIsAnalyzing(true);
    try {
      // FastAPI 서버에 POST 요청
      const resp = await fetch("http://localhost:8000/api/analyze-text", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value, type: 'comment', postId }),
        signal: controller.signal,
      });
      if (!resp.ok) throw new Error(`분석 실패: ${resp.status}`);
      const data = await resp.json();
      setAnalysis(data); // 기대 형태: { is_safe: true/false, sentiment?: 'pos/neg/neu', ... }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[analyzeText] 오류:', err);
        setAnalysis(null);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [postId]);

  // 입력 핸들러 (디바운스 + IME 고려)
  const onChange = useCallback((e) => {
    const v = e.target.value ?? '';
    setText(v);

    // 조합 중에는 분석 지연
    if (isComposing) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => analyzeText(v), 500);
  }, [analyzeText, isComposing]);

  const onCompositionStart = () => setIsComposing(true);
  const onCompositionEnd = (e) => {
    setIsComposing(false);
    // 조합 끝난 최종 문자열로 분석 시작
    const v = e.target.value ?? '';
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => analyzeText(v), 300);
  };

  // 제출 핸들러
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;

    if (analysis && analysis.is_safe === false) {
      alert('부적절한 내용이 포함되어 있습니다.');
      return;
    }

    await addComment(String(postId), v);
    setText('');
    setAnalysis(null);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, [text, analysis, addComment, postId]);

  const close = () => openComments(null);

  return (
    <div className={styles.backdrop} onClick={close}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>댓글</h3>
          <button className={styles.close} aria-label="닫기" onClick={close}>
            <X />
          </button>
        </div>

        <div className={styles.list}>
          {comments.length === 0 ? (
            <p className={styles.empty}>아직 댓글이 없습니다.</p>
          ) : (
            comments.map((c) => (
              <CommentItem key={c.id} c={c} onDelete={() => deleteComment(postId, c.id)} />
            ))
          )}
        </div>

        <form className={styles.inputRow} onSubmit={handleSubmit}>
          <div className={styles.inputWrap}>
            <input
              id="comment-input"
              name="comment"
              type="text"
              maxLength={300}
              placeholder="댓글 달기…"
              className={styles.input}
              value={text}
              onChange={onChange}
              onInput={onChange} // 일부 브라우저/IME 대비
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              autoComplete="off"
            />
            {/* 상태/결과 표시 (오버레이가 입력을 가리지 않게 pointer-events: none 권장) */}
            {isAnalyzing && (
              <div className={styles.analysisIndicator} style={{ pointerEvents: 'none' }}>
                ⟳ 분석 중…
              </div>
            )}
            {analysis && (
              <div
                className={styles.analysisResult}
                style={{ pointerEvents: 'none', color: analysis.is_safe ? '#2a7' : '#e33' }}
              >
                {analysis.is_safe ? '✓ 안전' : '⚠ 부적절'}
              </div>
            )}
          </div>

          <button
            className={styles.postBtn}
            disabled={!text.trim() || isAnalyzing || (analysis && analysis.is_safe === false)}
            type="submit"
          >
            게시
          </button>
        </form>
      </div>
    </div>
  );
}

function CommentItem({ c, onDelete }) {
  const username = c.user ?? c.username ?? '익명';
  const avatar = c.profileImage || null;
  const createdAt = c.createdAt ?? null;
  return (
    <div className={styles.item}>
      {avatar ? (
        <img className={styles.avatar} src={avatar} alt={username} />
      ) : (
        <div className={styles.avatarFallback}>{username.slice(0, 1).toUpperCase()}</div>
      )}
      <div className={styles.body}>
        <div className={styles.line}>
          <span className={styles.name}>{username}</span>
          <span className={styles.text}>{c.text}</span>
        </div>
        <div className={styles.meta}>
          {createdAt ? <span className={styles.time}>{timeAgo(createdAt)}</span> : null}
          <button className={styles.delete} onClick={onDelete}>삭제</button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
