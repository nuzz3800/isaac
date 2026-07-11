import { useEffect, useState } from "react";
import { ref, get, onValue } from "firebase/database";
import { db, isConfigured } from "./firebase";
import { loadSession, clearSession } from "./game";
import Home from "./components/Home";
import Lobby from "./components/Lobby";
import Writing from "./components/Writing";
import Voting from "./components/Voting";
import Result from "./components/Result";

export default function App() {
  const [session, setSession] = useState(null); // { roomCode, playerId }
  const [room, setRoom] = useState(null);
  const [checking, setChecking] = useState(true);
  const urlRoom = new URLSearchParams(window.location.search).get("room");

  // 접속 시 저장된 세션이 살아있으면 같은 플레이어로 자동 복귀
  useEffect(() => {
    if (!isConfigured) {
      setChecking(false);
      return;
    }
    (async () => {
      const saved = loadSession();
      if (saved && (!urlRoom || urlRoom === saved.roomCode)) {
        try {
          const snap = await get(
            ref(db, `rooms/${saved.roomCode}/players/${saved.playerId}`)
          );
          if (snap.exists()) {
            setSession(saved);
            setChecking(false);
            return;
          }
        } catch {
          // 네트워크 오류 등 — 홈으로
        }
        clearSession();
      }
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    if (!session) {
      setRoom(null);
      return;
    }
    return onValue(ref(db, `rooms/${session.roomCode}`), (snap) =>
      setRoom(snap.val())
    );
  }, [session]);

  function leave() {
    clearSession();
    setSession(null);
    setRoom(null);
    window.history.replaceState(null, "", window.location.pathname);
  }

  if (!isConfigured) return <SetupNotice />;
  if (checking) return <Splash text="접속 확인 중..." />;
  if (!session) return <Home urlRoom={urlRoom} onEnter={setSession} />;
  if (!room)
    return (
      <div className="app center">
        <p className="splash">방 정보를 불러오는 중...</p>
        <button className="btn btn-ghost" onClick={leave}>
          처음으로
        </button>
      </div>
    );

  const props = {
    room,
    roomCode: session.roomCode,
    playerId: session.playerId,
    onLeave: leave,
  };

  if (room.status === "lobby") return <Lobby {...props} />;
  if (room.status === "writing") return <Writing {...props} />;
  if (room.status === "playing")
    return <Voting key={room.currentTurnIndex} {...props} />;
  if (room.status === "done") return <Result {...props} />;
  return <Splash text="..." />;
}

function Splash({ text }) {
  return (
    <div className="app center">
      <p className="splash">{text}</p>
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="app">
      <h1 className="title">⚙️ Firebase 설정이 필요해요</h1>
      <div className="notice">
        <p>
          <code>src/firebase.js</code>의 <code>firebaseConfig</code>를 Firebase
          콘솔에서 받은 값으로 바꿔주세요.
        </p>
        <p>자세한 순서는 README.md에 있어요.</p>
      </div>
    </div>
  );
}
