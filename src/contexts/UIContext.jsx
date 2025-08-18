// UIContext.js
import React, { createContext, useState, useCallback } from 'react';

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
  // 댓글 모달이 열려 있는 포스트의 ID (null이면 닫힘)
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  // DM 모달 열림 여부
  const [isDMOpen, setIsDMOpen] = useState(false);

  const openComments = useCallback((postId) => {
    setActiveCommentPostId(postId);
  }, []);

  const closeComments = useCallback(() => {
    setActiveCommentPostId(null);
  }, []);

  const openDM = useCallback(() => {
    console.log("openDM 호출");
    setIsDMOpen(true);
  }, []);

  const closeDM = useCallback(() => {
    setIsDMOpen(false);
  }, []);

  return (
    <UIContext.Provider
      value={{
        activeCommentPostId,
        openComments,
        closeComments,
        isDMOpen,
        openDM,
        closeDM,
        setIsDMOpen
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
