import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ref, get } from "firebase/database";
import { db, isConfigured } from "./firebase";
import { getMyId, setMyId, clearMyId } from "./identity";
import { useMembers } from "./api/members";
import { BRAND } from "./branding";
import GameApp from "./game/GameApp";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import MemberDetail from "./pages/MemberDetail";
import Prayers from "./pages/Prayers";
import Events from "./pages/Events";
import Play from "./pages/Play";

const PASS_KEY = "joel-pass";

export default function App() {
  if (!isConfigured) return <SetupNotice />;
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

function Shell() {
  const location = useLocation();
  const members = useMembers();
  const [myId, setMyIdState] = useState(getMyId());
  // 입장 암호: DB의 config/passcode가 설정돼 있을 때만 작동 (없으면 그냥 통과)
  const [gate, setGate] = useState("loading"); // loading | open | locked
  const [expected, setExpected] = useState("");

  useEffect(() => {
    get(ref(db, "config/passcode"))
      .then((s) => {
        const v = s.val();
        if (!v || localStorage.getItem(PASS_KEY) === String(v)) {
          setGate("open");
        } else {
          setExpected(String(v));
          setGate("locked");
        }
      })
      .catch(() => setGate("open"));
  }, []);

  // 거짓말게임은 게이트/프로필 없이 접근 가능 (QR로 들어오는 손님용)
  if (location.pathname.startsWith("/game")) return <GameApp />;

  // 옛 QR 링크 호환: /?room=1234 → /game?room=1234
  if (
    location.pathname === "/" &&
    new URLSearchParams(location.search).get("room")
  )
    return <Navigate to={`/game${location.search}`} replace />;

  if (gate === "loading" || members === null)
    return <Splash text="사랑방 문 여는 중..." />;
  if (gate === "locked")
    return (
      <Gate
        expected={expected}
        onPass={() => {
          localStorage.setItem(PASS_KEY, expected);
          setGate("open");
        }}
      />
    );

  const me = myId ? members[myId] : null;
  if (!me)
    return (
      <Welcome
        members={members}
        onPicked={(id) => {
          setMyId(id);
          setMyIdState(id);
        }}
      />
    );

  const props = { members, myId, me };
  return (
    <div className="shell">
      <Routes>
        <Route path="/" element={<Dashboard {...props} />} />
        <Route path="/members" element={<Members {...props} />} />
        <Route
          path="/members/:id"
          element={
            <MemberDetail
              {...props}
              onSwitchProfile={() => {
                clearMyId();
                setMyIdState(null);
              }}
            />
          }
        />
        <Route path="/prayers" element={<Prayers {...props} />} />
        <Route path="/events" element={<Events {...props} />} />
        <Route path="/play" element={<Play />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
    </div>
  );
}

const TABS = [
  ["/", "🏠", "홈"],
  ["/members", "👥", "가원"],
  ["/prayers", "🙏", "기도"],
  ["/events", "📅", "일정"],
  ["/play", "🎲", "놀이"],
];

function TabBar() {
  return (
    <nav className="tabbar">
      {TABS.map(([to, icon, label]) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => `tab${isActive ? " active" : ""}`}
        >
          <span className="tab-icon">{icon}</span>
          <span className="tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Gate({ onPass, expected }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="app center">
      <div className="hero">
        <p className="brand-eyebrow">
          {BRAND.church} · {BRAND.group}
        </p>
        <div className="hero-emoji">🚪</div>
        <h1 className="title">우리 사랑방 암호는?</h1>
        <p className="subtitle">가원들만 아는 그 암호를 입력해주세요</p>
      </div>
      <div className="stack">
        <input
          className="input input-code"
          placeholder="암호"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check()}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" onClick={check}>
          입장
        </button>
      </div>
    </div>
  );

  function check() {
    if (input.trim() === expected) onPass();
    else setError("음... 그 암호가 아니에요 🤔");
  }
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
      </div>
    </div>
  );
}
