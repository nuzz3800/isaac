import { useState } from "react";
import { createRoom, joinRoom } from "../game";
import { BRAND } from "../branding";

export default function Home({ urlRoom, onEnter }) {
  // QR/링크로 들어오면 (?room=1234) 바로 닉네임 입력으로 직행
  const [mode, setMode] = useState(urlRoom ? "join" : "menu");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState(urlRoom || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function enter() {
    const name = nickname.trim();
    if (!name) return setError("닉네임을 입력해줘요.");
    if (name.length > 10) return setError("닉네임은 10자 이내로 해줘요.");
    setBusy(true);
    setError("");
    try {
      if (mode === "create") {
        onEnter(await createRoom(name));
      } else {
        const trimmed = code.trim();
        if (!/^\d{4}$/.test(trimmed))
          throw new Error("방 코드는 4자리 숫자예요.");
        onEnter(await joinRoom(trimmed, name));
      }
    } catch (e) {
      setError(e.message || "문제가 생겼어요. 다시 시도해줘요.");
      setBusy(false);
    }
  }

  if (mode === "menu") {
    return (
      <div className="app center">
        <div className="hero">
          <p className="brand-eyebrow">
            {BRAND.church} · {BRAND.group}
          </p>
          <div className="hero-emoji">🤥</div>
          <h1 className="title">{BRAND.appName}</h1>
          <p className="subtitle">{BRAND.homeSubtitle}</p>
        </div>
        <div className="stack">
          <button className="btn btn-primary" onClick={() => setMode("create")}>
            방 만들기
          </button>
          <button className="btn btn-ghost" onClick={() => setMode("join")}>
            방 코드로 참여하기
          </button>
        </div>
        <p className="hint">{BRAND.homeFooter}</p>
      </div>
    );
  }

  return (
    <div className="app center">
      <div className="hero">
        <p className="brand-eyebrow">{BRAND.group}</p>
        <h1 className="title">
          {urlRoom
            ? BRAND.joinWelcome
            : mode === "create"
              ? "새 방 만들기"
              : "방 참여하기"}
        </h1>
        {urlRoom && <p className="subtitle">{BRAND.joinSub}</p>}
      </div>
      <div className="stack">
        {mode === "join" && (
          <input
            className="input input-code"
            inputMode="numeric"
            maxLength={4}
            placeholder="방 코드 4자리"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={!!urlRoom}
          />
        )}
        <input
          className="input"
          placeholder="닉네임"
          maxLength={10}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enter()}
          autoFocus
        />
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" onClick={enter} disabled={busy}>
          {busy ? "들어가는 중..." : "입장"}
        </button>
        {!urlRoom && (
          <button className="btn btn-ghost" onClick={() => setMode("menu")}>
            뒤로
          </button>
        )}
      </div>
    </div>
  );
}
