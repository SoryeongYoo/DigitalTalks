// hooks/useToxicityDetection.js
import { useState } from 'react';
import { runToxicityModel } from '../services/toxicityService';

export const useToxicityDetection = () => {
  const [status, setStatus] = useState('safe'); // safe | toxic | checking

  const checkToxicity = async (text) => {
    if (!text.trim()) {
      setStatus('safe');
      return 'safe';
    }
    setStatus('checking');
    try {
      const result = await runToxicityModel(text);
      // 모델 결과값 예: { label: "toxic", score: 0.92 }
      if (result.label === 'toxic') {
        setStatus('toxic');
        return 'toxic';
      } else {
        setStatus('safe');
        return 'safe';
      }
    } catch (err) {
      console.error('혐오탐지 실패:', err);
      setStatus('safe');
      return 'safe';
    }
  };

  return { status, checkToxicity };
};
