// src/components/messages/MessageScreen.jsx (개선된 버전)
import React, { useState, useEffect, useCallback } from 'react';
import { Avatar } from '../common/Avatar';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ChatMessage } from './ChatMessage';
import { MessageItem } from './MessageItem';
import RewritingSuggestion from './RewritingSuggestion';
import { ArrowLeft, MessageCircle, Phone, Video, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeRewriting } from '../../hooks/useRealtimeRewriting';
import { db } from '../../firebase';
import styles from './MessageScreen.module.css';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { useToxicityDetection } from '../../hooks/useToxicityDetection';

const MessageScreen = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { currentUser, loading } = useAuth();
  const [partnerUidInput, setPartnerUidInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [userInfoCache, setUserInfoCache] = useState({});
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [ignoreRewrite, setIgnoreRewrite] = useState(false);

  // 리라이팅 훅
  const {
    suggestion,
    isLoading: isRewriting,
    showSuggestion,
    isApplying,
    requestRewrite,
    applySuggestion,
    dismissSuggestion,
    cleanup
  } = useRealtimeRewriting(messages, currentUser);

  const navigate = useNavigate();
  const { status: toxicityStatus, checkToxicity } = useToxicityDetection();

  // 유틸리티 함수들
  const buildChatId = useCallback((a, b) => [a, b].sort().join('_'), []);

  const getUserInfo = useCallback(async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return {
          uid: uid,
          username: userDoc.data().username || 'Unknown User',
          profileImage: userDoc.data().profileImage || '/img/default_profile.png',
          ...userDoc.data()
        };
      }
      return {
        uid: uid,
        username: 'Unknown User',
        profileImage: '/img/default_profile.png'
      };
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      return {
        uid: uid,
        username: 'Unknown User',
        profileImage: '/img/default_profile.png'
      };
    }
  }, []);

  const findUserByUsername = useCallback(async (username) => {
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '==', username)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          uid: userDoc.id,
          username: userDoc.data().username,
          profileImage: userDoc.data().profileImage || '/img/default_profile.png',
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      return null;
    }
  }, []);

  const findOrCreateChatRoom = useCallback(async (currentUid, partnerUid) => {
    const chatId = buildChatId(currentUid, partnerUid);
    const chatDocRef = doc(db, 'chats', chatId);
    const snap = await getDoc(chatDocRef);

    if (snap.exists()) {
      return { id: chatId, ...snap.data() };
    }

    const newRoom = {
      members: [currentUid, partnerUid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: '',
    };
    await setDoc(chatDocRef, newRoom);
    return { id: chatId, ...newRoom };
  }, [buildChatId]);

  const getUserInfoWithCache = useCallback(async (uid) => {
    if (userInfoCache[uid]) {
      return userInfoCache[uid];
    }

    const userInfo = await getUserInfo(uid);
    setUserInfoCache(prev => ({
      ...prev,
      [uid]: userInfo
    }));
    return userInfo;
  }, [userInfoCache, getUserInfo]);

  const getPartnerInfo = useCallback((room, myUid) => {
    if (!room || !Array.isArray(room.members)) {
      return { uid: '', username: '대화상대', profileImage: '/img/default_profile.png' };
    }
    const partnerUid = room.members.find((m) => m !== myUid) || room.members[0];

    if (room.memberInfo && room.memberInfo[partnerUid]) {
      return {
        uid: partnerUid || '상대방',
        username: room.memberInfo[partnerUid].username || '대화상대',
        profileImage: room.memberInfo[partnerUid].profileImage || '/img/default_profile.png'
      };
    }

    if (userInfoCache[partnerUid]) {
      return {
        uid: partnerUid,
        username: userInfoCache[partnerUid].username,
        profileImage: userInfoCache[partnerUid].profileImage
      };
    }

    return {
      uid: partnerUid || '상대방',
      username: '로딩 중...',
      profileImage: '/img/default_profile.png'
    };
  }, [userInfoCache]);

  const formatTime = useCallback((ts) => {
    try {
      return ts && ts.toDate ? ts.toDate().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }) : '';
    } catch {
      return '';
    }
  }, []);

  // 혐오 표현 탐지 및 리라이팅 로직
  useEffect(() => {
    // 빈 메시지일 때 초기화
    if (newMessage.trim() === "") {
      setIgnoreRewrite(false);
      dismissSuggestion();
      return;
    }

    // 무시 상태이거나 적용 중일 때는 건너뛰기
    if (ignoreRewrite || isApplying) return;

    // 디바운스 처리
    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkToxicity(newMessage);
        
        // 혐오 표현 감지 시 리라이팅 요청
        if (result === 'toxic' && !isRewriting && !showSuggestion) {
          requestRewrite(newMessage.trim(), messages, currentUser?.uid);
        }
      } catch (error) {
        console.error('혐오 표현 탐지 실패:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newMessage, ignoreRewrite, isApplying, checkToxicity, requestRewrite, messages, currentUser, isRewriting, showSuggestion, dismissSuggestion]);

  // 인증 확인 및 로그아웃 처리
  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      setIsNavigating(true);
      setSelectedChat(null);
      setChatRooms([]);
      setMessages([]);
      setPartnerUidInput('');
      setBusy(false);
      navigate('/auth', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  // 현재 사용자 정보 로드
  useEffect(() => {
    if (currentUser?.uid) {
      getUserInfo(currentUser.uid).then(setCurrentUserInfo);
    }
  }, [currentUser, getUserInfo]);

  // 채팅방 목록 실시간 업데이트
  useEffect(() => {
    if (!currentUser?.uid) {
      setChatRooms([]);
      return;
    }

    const qRooms = query(
      collection(db, 'chats'),
      where('members', 'array-contains', currentUser.uid)
    );

    const unsub = onSnapshot(qRooms, async (snap) => {
      const rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 사용자 정보 미리 로드
      for (const room of rooms) {
        const partnerUid = (room.members || []).find((m) => m !== currentUser.uid);
        if (partnerUid && !userInfoCache[partnerUid] && !room.memberInfo?.[partnerUid]) {
          getUserInfoWithCache(partnerUid);
        }
      }

      setChatRooms(rooms);
    });

    return () => unsub();
  }, [currentUser, userInfoCache, getUserInfoWithCache]);

  // 메시지 실시간 업데이트
  useEffect(() => {
    if (!selectedChat?.id) return;

    const qMsgs = query(
      collection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(qMsgs, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [selectedChat]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // 이벤트 핸들러들
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setNewMessage(value);

    // 입력이 비어있으면 제안 해제
    if (!value.trim()) {
      dismissSuggestion();
      setIgnoreRewrite(false);
    }
  }, [dismissSuggestion]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedChat?.id || !currentUser?.uid) return;

    try {
      const chatMsgRef = collection(db, 'chats', selectedChat.id, 'messages');
      await addDoc(chatMsgRef, {
        senderId: currentUser.uid,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: newMessage.trim(),
        updatedAt: serverTimestamp(),
      });

      setNewMessage('');
      setIgnoreRewrite(false);
      cleanup();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해 주세요.');
    }
  }, [newMessage, selectedChat, currentUser, cleanup]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Tab' && showSuggestion && suggestion) {
      e.preventDefault();
      handleApplySuggestion();
    } else if (e.key === 'Escape' && (showSuggestion || isRewriting)) {
      e.preventDefault();
      dismissSuggestion();
      setIgnoreRewrite(true);
    }
  }, [handleSendMessage, showSuggestion, suggestion, isRewriting, dismissSuggestion]);

  const handleApplySuggestion = useCallback(() => {
    const appliedText = applySuggestion();
    if (appliedText) {
      setNewMessage(appliedText);
      setIgnoreRewrite(true); // 적용 후에는 다시 탐지하지 않음
    }
  }, [applySuggestion]);

  const handleCreateNewChat = useCallback(async () => {
    if (!partnerUidInput.trim() || !currentUser?.uid || busy) return;

    try {
      setBusy(true);

      const foundUser = await findUserByUsername(partnerUidInput.trim());
      if (!foundUser) {
        alert('사용자를 찾을 수 없습니다.');
        return;
      }

      if (foundUser.uid === currentUser.uid) {
        alert('자기 자신과는 대화할 수 없습니다.');
        return;
      }

      const room = await findOrCreateChatRoom(currentUser.uid, foundUser.uid);
      setSelectedChat(room);
      setPartnerUidInput('');
    } catch (error) {
      console.error('대화방 생성 실패:', error);
      alert('대화방 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }, [partnerUidInput, currentUser, busy, findUserByUsername, findOrCreateChatRoom]);

  const handleChatRoomSelect = useCallback(async (room) => {
    try {
      const partner = getPartnerInfo(room, currentUser?.uid);
      const foundRoom = await findOrCreateChatRoom(currentUser.uid, partner.uid);
      setSelectedChat(foundRoom);
    } catch (error) {
      console.error('채팅방 선택 실패:', error);
    }
  }, [getPartnerInfo, currentUser, findOrCreateChatRoom]);

  // 로딩 중이거나 네비게이션 중일 때는 로딩 화면 표시
  if (loading || isNavigating) {
    return (
      <div className={styles.fullPageWrapper}>
        <div className={styles.panel}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontSize: '16px',
            color: '#666'
          }}>
            로딩 중...
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className={styles.fullPageWrapper}>
      <div className={styles.panel}>
        {!selectedChat ? (
          <div className={styles.messageListContainer}>
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <button
                  onClick={() => navigate(-1)}
                  className={styles.backButton}
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 className={styles.headerTitle}>
                  {currentUserInfo?.username || 'user'}
                </h2>
              </div>
            </div>

            <div className={styles.messageList}>
              {chatRooms.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageCircle className={styles.emptyIcon} />
                  <h3>메시지가 없습니다</h3>
                  <p>친구들과 비공개 사진과 메시지를 공유해보세요.</p>

                  <div className={styles.newChatForm}>
                    <Input
                      placeholder="사용자명 입력"
                      value={partnerUidInput}
                      onChange={(e) => setPartnerUidInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateNewChat()}
                      className={styles.searchInput}
                    />
                    <Button
                      onClick={handleCreateNewChat}
                      disabled={busy || !partnerUidInput.trim()}
                      className={styles.newChatButton}
                    >
                      {busy ? '검색 중...' : '검색'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.messagesHeader}>
                    <h3>메시지</h3>
                  </div>

                  <div className={styles.newChatForm}>
                    <Input
                      placeholder="사용자명 입력"
                      value={partnerUidInput}
                      onChange={(e) => setPartnerUidInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateNewChat()}
                      className={styles.searchInput}
                    />
                    <Button
                      onClick={handleCreateNewChat}
                      disabled={busy || !partnerUidInput.trim()}
                      className={styles.newChatButton}
                    >
                      {busy ? '검색 중...' : '검색'}
                    </Button>
                  </div>

                  {chatRooms.map((room) => {
                    const partner = getPartnerInfo(room, currentUser?.uid);
                    return (
                      <MessageItem
                        key={room.id}
                        message={{
                          id: room.id,
                          user: {
                            username: partner.username,
                            profileImage: partner.profileImage,
                          },
                          lastMessage: room.lastMessage || '대화 없음',
                          time: formatTime(room.updatedAt),
                          unread: false
                        }}
                        onClick={() => handleChatRoomSelect(room)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <button
                  onClick={() => setSelectedChat(null)}
                  className={styles.chatBackButton}
                >
                  <ArrowLeft size={24} />
                </button>
                <Avatar
                  src={getPartnerInfo(selectedChat, currentUser?.uid).profileImage}
                  alt="상대방"
                  size="sm"
                  className={styles.chatAvatar}
                />
                <span className={styles.chatUsername}>
                  {getPartnerInfo(selectedChat, currentUser?.uid).username}
                </span>
              </div>
              <div className={styles.chatHeaderRight}>
                <button className={styles.iconButton}>
                  <Phone size={20} />
                </button>
                <button className={styles.iconButton}>
                  <Video size={20} />
                </button>
                <button className={styles.iconButton}>
                  <Info size={20} />
                </button>
              </div>
            </div>

            <div className={styles.chatMessages}>
              {messages.length === 0 ? (
                <div className={styles.chatEmptyState}>
                  <Avatar
                    src={getPartnerInfo(selectedChat, currentUser?.uid).profileImage}
                    alt="상대방"
                    size="lg"
                  />
                  <h3>{getPartnerInfo(selectedChat, currentUser?.uid).username}</h3>
                  <p>Instagram에서 대화를 시작하세요</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={{
                      message: msg.text,
                      timestamp: formatTime(msg.timestamp)
                    }}
                    isOwn={msg.senderId === currentUser?.uid}
                  />
                ))
              )}
            </div>

            {/* 리라이팅 기능이 통합된 입력창 */}
            <div className={styles.chatInputContainer}>
              <div className={styles.inputWrapper} style={{ position: 'relative' }}>
                {/* 리라이팅 제안 표시 */}
                {!ignoreRewrite && (
                  <RewritingSuggestion
                    originalText={newMessage}
                    suggestion={suggestion}
                    isLoading={isRewriting}
                    onApply={handleApplySuggestion}
                    onDismiss={() => {
                      dismissSuggestion();
                      setIgnoreRewrite(true);
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Input
                    placeholder="메시지 입력... (Tab: 제안 적용, Esc: 제안 무시)"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    className={clsx(styles.messageInput, {
                      [styles.messageInputWithSuggestion]: showSuggestion || isRewriting
                    })}
                    style={{
                      borderColor: (showSuggestion || isRewriting) ? '#3b82f6' : undefined
                    }}
                  />

                  {/* 리라이팅 로딩 표시 */}
                  {isRewriting && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #f3f4f6',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }} />
                  )}

                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={clsx(styles.sendButton, {
                      [styles.sendButtonActive]: newMessage.trim()
                    })}
                  >
                    전송
                  </Button>
                </div>

                {/* 키보드 힌트 */}
                {showSuggestion && suggestion && (
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      background: '#f9fafb',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <kbd style={{
                        background: '#e5e7eb',
                        color: '#374151',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: '600',
                        margin: '0 2px'
                      }}>Tab</kbd>
                      적용 •
                      <kbd style={{
                        background: '#e5e7eb',
                        color: '#374151',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: '600',
                        margin: '0 2px'
                      }}>Esc</kbd>
                      무시
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageScreen;