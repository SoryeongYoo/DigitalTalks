// src/services/toxicityService.js
export const runToxicityModel = async (text) => {
  const res = await fetch("http://localhost:8000/api/analyze-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error("API 호출 실패: " + errText);
  }

  const data = await res.json();
  // API 응답은 { is_safe: true/false, sentiment: ... }
  return {
    label: data.is_safe ? "safe" : "toxic",
    score: data.is_safe ? 0.0 : 1.0, // 점수는 단순화 (필요하면 확장)
  };
};
