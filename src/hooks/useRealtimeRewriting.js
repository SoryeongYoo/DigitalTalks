// // hooks/useRealtimeRewriting.js
// import { useState, useCallback, useRef } from 'react';

// export const useRealtimeRewriting = (messages = [], currentUser = null) => {
//   const [suggestion, setSuggestion] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [showSuggestion, setShowSuggestion] = useState(false);
//   const timeoutRef = useRef(null);
//   const abortControllerRef = useRef(null);

//   // 대화 맥락 생성 (A와 B 형태로)
//   const createContext = useCallback((inputText, messages, currentUserId) => {
//     // 최근 5개 메시지만 사용
//     const recentMessages = messages.slice(-5);
    
//     // 현재 사용자와 상대방을 A, B로 구분
//     let currentUserLabel = 'B'; // 현재 사용자는 보통 B (답변하는 쪽)
//     let partnerLabel = 'A';
    
//     // 메시지들을 A: B: 형태로 변환
//     const contextParts = recentMessages.map(msg => {
//       const label = msg.senderId === currentUserId ? currentUserLabel : partnerLabel;
//       return `${label}: ${msg.text}`;
//     });
    
//     // 현재 입력하는 메시지 추가
//     if (inputText.trim()) {
//       contextParts.push(`${currentUserLabel}: ${inputText}`);
//     }
    
//     return contextParts.join(' ');
//   }, []);

//   // FastAPI 호출
//   const callRewritingAPI = useCallback(async (contextText) => {
//     try {
//       // 이전 요청 취소
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
      
//       abortControllerRef.current = new AbortController();

//       const response = await fetch('http://localhost:8000/api/v1/rewrite', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           text: contextText,
//           max_length: 100,
//           min_length: 5,
//           temperature: 0.7,
//           num_beams: 3,
//           do_sample: true
//         }),
//         signal: abortControllerRef.current.signal
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }
      
//       const result = await response.json();
//       console.log('API Response:', result); // 디버깅용
      
//       if (result.success && result.rewritten_text) {
//         return result.rewritten_text;
//       }
      
//       return null;
//     } catch (error) {
//       if (error.name === 'AbortError') {
//         console.log('Request aborted');
//         return null;
//       }
//       console.error('Rewriting API Error:', error);
//       return null;
//     }
//   }, []);

//   // 사용자 메시지 부분만 추출
//   const extractUserMessage = useCallback((rewrittenText) => {
//     // "B: 메시지" 형태에서 메시지 부분만 추출
//     const bMessageMatch = rewrittenText.match(/B:\s*(.+)$/i);
//     if (bMessageMatch) {
//       return bMessageMatch[1].trim();
//     }
    
//     // 패턴이 맞지 않으면 전체 텍스트에서 마지막 문장 추출
//     const sentences = rewrittenText.split(/[.!?]\s+/);
//     return sentences[sentences.length - 1].trim();
//   }, []);

//   // 디바운스된 리라이팅 함수
//   const requestRewrite = useCallback((inputText, messages, currentUserId) => {
//     // 기존 타이머 클리어
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }

//     // 입력이 너무 짧으면 리라이팅 안함
//     if (!inputText || inputText.trim().length < 3) {
//       setShowSuggestion(false);
//       setSuggestion('');
//       setIsLoading(false);
//       return;
//     }

//     setIsLoading(true);
//     setShowSuggestion(false);

//     // 1초 후 API 호출
//     timeoutRef.current = setTimeout(async () => {
//       try {
//         const contextText = createContext(inputText, messages, currentUserId);
//         console.log('Context Text:', contextText); // 디버깅용
        
//         const rewrittenText = await callRewritingAPI(contextText);
        
//         setIsLoading(false);
        
//         if (rewrittenText && rewrittenText.trim() !== inputText.trim()) {
//           const userMessage = extractUserMessage(rewrittenText);
          
//           // 원본과 다르고, 의미가 있는 경우에만 제안
//           if (userMessage && userMessage !== inputText.trim() && userMessage.length > 1) {
//             setSuggestion(userMessage);
//             setShowSuggestion(true);
//           } else {
//             setShowSuggestion(false);
//             setSuggestion('');
//           }
//         } else {
//           setShowSuggestion(false);
//           setSuggestion('');
//         }
//       } catch (error) {
//         console.error('Rewrite error:', error);
//         setIsLoading(false);
//         setShowSuggestion(false);
//         setSuggestion('');
//       }
//     }, 1000); // 1초 디바운스
//   }, [createContext, callRewritingAPI, extractUserMessage]);

//   // 제안 적용
//   const applySuggestion = useCallback(() => {
//     const applied = suggestion;
//     setSuggestion('');
//     setShowSuggestion(false);
//     return applied;
//   }, [suggestion]);

//   // 제안 거절
//   const dismissSuggestion = useCallback(() => {
//     setSuggestion('');
//     setShowSuggestion(false);
//   }, []);

//   // 정리 함수
//   const cleanup = useCallback(() => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }
//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//     }
//     setSuggestion('');
//     setShowSuggestion(false);
//     setIsLoading(false);
//   }, []);

//   return {
//     suggestion,
//     isLoading,
//     showSuggestion,
//     requestRewrite,
//     applySuggestion,
//     dismissSuggestion,
//     cleanup
//   };
// };
// hooks/useRealtimeRewriting.js
import { useState, useCallback, useRef } from 'react';

export const useRealtimeRewriting = (messages = [], currentUser = null) => {
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isApplying, setIsApplying] = useState(false); // 적용 중 상태 추가
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 대화 맥락 생성 (A와 B 형태로)
  const createContext = useCallback((inputText, messages, currentUserId) => {
    // 최근 5개 메시지만 사용
    const recentMessages = messages.slice(-5);
    
    // 현재 사용자와 상대방을 A, B로 구분
    let currentUserLabel = 'B'; // 현재 사용자는 보통 B (답변하는 쪽)
    let partnerLabel = 'A';
    
    // 메시지들을 A: B: 형태로 변환
    const contextParts = recentMessages.map(msg => {
      const label = msg.senderId === currentUserId ? currentUserLabel : partnerLabel;
      return `${label}: ${msg.text}`;
    });
    
    // 현재 입력하는 메시지 추가
    if (inputText.trim()) {
      contextParts.push(`${currentUserLabel}: ${inputText}`);
    }
    
    return contextParts.join(' ');
  }, []);

  // FastAPI 호출
  const callRewritingAPI = useCallback(async (contextText) => {
    try {
      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      const response = await fetch('http://localhost:8001/api/v1/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: contextText,
          max_length: 100,
          min_length: 5,
          temperature: 0.7,
          num_beams: 3,
          do_sample: true
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result); // 디버깅용
      
      if (result.success && result.rewritten_text) {
        return result.rewritten_text;
      }
      
      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return null;
      }
      console.error('Rewriting API Error:', error);
      return null;
    }
  }, []);

  // 사용자 메시지 부분만 추출
  const extractUserMessage = useCallback((rewrittenText) => {
    // "B: 메시지" 형태에서 메시지 부분만 추출
    const bMessageMatch = rewrittenText.match(/B:\s*(.+)$/i);
    if (bMessageMatch) {
      return bMessageMatch[1].trim();
    }
    
    // 패턴이 맞지 않으면 전체 텍스트에서 마지막 문장 추출
    const sentences = rewrittenText.split(/[.!?]\s+/);
    return sentences[sentences.length - 1].trim();
  }, []);

  // 디바운스된 리라이팅 함수
  const requestRewrite = useCallback((inputText, messages, currentUserId) => {
    // 적용 중이면 리라이팅 요청하지 않음
    if (isApplying) {
      return;
    }

    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 입력이 너무 짧으면 리라이팅 안함
    if (!inputText || inputText.trim().length < 3) {
      setShowSuggestion(false);
      setSuggestion('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setShowSuggestion(false);

    // 1초 후 API 호출
    timeoutRef.current = setTimeout(async () => {
      try {
        const contextText = createContext(inputText, messages, currentUserId);
        console.log('Context Text:', contextText); // 디버깅용
        
        const rewrittenText = await callRewritingAPI(contextText);
        
        setIsLoading(false);
        
        if (rewrittenText && rewrittenText.trim() !== inputText.trim()) {
          const userMessage = extractUserMessage(rewrittenText);
          
          // 원본과 다르고, 의미가 있는 경우에만 제안
          if (userMessage && userMessage !== inputText.trim() && userMessage.length > 1) {
            setSuggestion(userMessage);
            setShowSuggestion(true);
          } else {
            setShowSuggestion(false);
            setSuggestion('');
          }
        } else {
          setShowSuggestion(false);
          setSuggestion('');
        }
      } catch (error) {
        console.error('Rewrite error:', error);
        setIsLoading(false);
        setShowSuggestion(false);
        setSuggestion('');
      }
    }, 1000); // 1초 디바운스
  }, [createContext, callRewritingAPI, extractUserMessage, isApplying]);

  // 제안 적용
  const applySuggestion = useCallback(() => {
    const applied = suggestion;
    
    // 적용 중 상태로 변경
    setIsApplying(true);
    setSuggestion('');
    setShowSuggestion(false);
    setIsLoading(false);
    
    // 진행 중인 타이머와 요청 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 500ms 후에 적용 중 상태 해제 (충분한 시간)
    setTimeout(() => {
      setIsApplying(false);
    }, 500);
    
    return applied;
  }, [suggestion]);

  // 제안 거절
  const dismissSuggestion = useCallback(() => {
    setSuggestion('');
    setShowSuggestion(false);
  }, []);

  // 정리 함수
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSuggestion('');
    setShowSuggestion(false);
    setIsLoading(false);
    setIsApplying(false);
  }, []);

  return {
    suggestion,
    isLoading,
    showSuggestion,
    isApplying,
    requestRewrite,
    applySuggestion,
    dismissSuggestion,
    cleanup
  };
};