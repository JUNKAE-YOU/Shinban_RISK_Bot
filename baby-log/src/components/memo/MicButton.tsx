"use client";

type Props = {
  listening: boolean;
  supported: boolean;
  onClick: () => void;
};

/** 육아 중 한 손으로도 누르기 쉬운 대형 음성 입력 버튼 */
export default function MicButton({ listening, supported, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!supported}
      aria-pressed={listening}
      aria-label={listening ? "음성 입력 중지" : "음성으로 입력하기"}
      className={`btn relative w-full py-6 text-xl text-white shadow-md ${
        listening ? "bg-danger" : "bg-accent"
      }`}
    >
      {listening && (
        <span className="absolute inset-0 animate-ping rounded-2xl bg-danger/40" aria-hidden />
      )}
      <span className="relative text-3xl" aria-hidden>
        {listening ? "⏹️" : "🎤"}
      </span>
      <span className="relative">
        {!supported ? "음성 인식 미지원 브라우저" : listening ? "듣는 중… 눌러서 멈추기" : "눌러서 말하기"}
      </span>
    </button>
  );
}
