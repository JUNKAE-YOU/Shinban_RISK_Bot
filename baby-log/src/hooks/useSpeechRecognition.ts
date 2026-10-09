"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ---- Web Speech API 최소 타입 정의 (TS 기본 lib 에 없음) ---- */
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "마이크 권한이 거부되었어요. 브라우저 설정에서 마이크를 허용해 주세요.",
  "service-not-allowed": "이 브라우저에서는 음성 인식을 사용할 수 없어요.",
  "audio-capture": "마이크를 찾을 수 없어요.",
  network: "네트워크 오류로 음성 인식에 실패했어요.",
};

const noopSubscribe = () => () => {};

type Options = {
  lang?: string;
  /** 문장이 확정될 때마다 호출 (입력창에 이어 붙이는 용도) */
  onFinal: (text: string) => void;
};

/**
 * 브라우저 내장 Web Speech API 를 이용한 음성 → 텍스트 변환 훅.
 * - Chrome(Android/PC), Safari(iOS 14.5+), Edge 지원
 * - 확정된 문장은 onFinal 로, 말하는 중인 문장은 interim 으로 제공
 */
export function useSpeechRecognition({ lang = "ko-KR", onFinal }: Options) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => getCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  // 사용자가 '중지'를 누르기 전까지는 계속 듣기 (Android 는 침묵 시 자동 종료됨)
  const wantListening = useRef(false);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  const stop = useCallback(() => {
    wantListening.current = false;
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("이 브라우저는 음성 인식을 지원하지 않아요. Chrome 또는 Safari 를 사용해 주세요.");
      return;
    }
    recRef.current?.abort();

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          const trimmed = text.trim();
          if (trimmed) onFinalRef.current(trimmed);
        } else {
          interimText += text;
        }
      }
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      wantListening.current = false;
      setError(ERROR_MESSAGES[e.error] ?? `음성 인식 오류: ${e.error}`);
    };

    rec.onend = () => {
      setInterim("");
      if (wantListening.current && recRef.current === rec) {
        try {
          rec.start(); // 침묵으로 끊긴 경우 자동 재시작
          return;
        } catch {
          /* 재시작 실패 시 종료 처리 */
        }
      }
      if (recRef.current === rec) {
        recRef.current = null;
        setListening(false);
      }
    };

    recRef.current = rec;
    wantListening.current = true;
    setError(null);
    setInterim("");
    try {
      rec.start();
      setListening(true);
    } catch {
      wantListening.current = false;
      setError("음성 인식을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(
    () => () => {
      wantListening.current = false;
      recRef.current?.abort();
    },
    [],
  );

  return { supported, listening, interim, error, start, stop, toggle };
}
