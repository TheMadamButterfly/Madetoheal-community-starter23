import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

/* ---------- Section wrapper ---------- */
function Section({ title, children }) {
  return (
    <div className="card" style={{ margin: '12px 0' }}>
      {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
      {children}
    </div>
  );
}

/* ---------- Header + Tabs ---------- */
function Header({ user, onLogout, setTab, tab }) {
  const TabBtn = ({ id, label }) => (
    <button
      className="button ghost"
      onClick={() => setTab(id)}
      style={{ opacity: tab === id ? 1 : 0.7 }}
    >
      {label}
    </button>
  );
  return (
    <header className="header">
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>🌿 Made to Heal — Community</div>
        <div className="badge">
          A supportive space for healers, practitioners, and the community.
        </div>
      </div>
      <div className="nav">
        <TabBtn id="feed" label="Feed" />
        <TabBtn id="profile" label="Profile" />
        <TabBtn id="about" label="About" />
        <TabBtn id="guidelines" label="Guidelines" />
        {user && (
          <button className="button" onClick={onLogout} style={{ marginLeft: 8 }}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

/* ---------- Auth (Login/Register) ---------- */
function Auth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login');

  async function submit() {
    try {
      if (mode === 'login') {
        const r = await axios.post(API + '/auth/login', { email, password });
        localStorage.token = r.data.token;
        onAuth(r.data.user);
      } else {
        const r = await axios.post(API + '/auth/register', { email, password, name });
        localStorage.token = r.data.token;
        onAuth(r.data.user);
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Auth error';
      alert(msg);
      console.error(e?.response?.data || e);
    }
  }

  return (
    <Section title={mode === 'login' ? 'Login' : 'Create your account'}>
      <input
        className="input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {mode === 'register' && (
        <input
          className="input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="button" onClick={submit}>
          {mode === 'login' ? 'Login' : 'Create'}
        </button>
        <button
          className="button ghost"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
      </div>
    </Section>
  );
}

/* ---------- Composer (create post) ---------- */
function Composer({ onPosted }) {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [busy, setBusy] = useState(false);

  async function post() {
    try {
      setBusy(true);
      await axios.post(
        API + '/posts',
        { body: text, image_url: imageUrl || null, visibility },
        { headers: { Authorization: 'Bearer ' + localStorage.token } }
      );
      setText('');
      setImageUrl('');
      setVisibility('public');
      onPosted();
    } catch (e) {
      alert('Post failed');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Share something with the community">
      <textarea
        className="textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What would you like to share?"
        rows={4}
      />
      <input
        className="input"
        placeholder="Optional image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <label className="badge">Visibility</label>
        <select
          className="select"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="public">Public</option>
          <option value="members">Members</option>
        </select>
        <button
          className="button"
          onClick={post}
          disabled={busy}
          style={{ marginLeft: 'auto' }}
        >
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>
    </Section>
  );
}

/* ---------- Comments ---------- */
function Comments({ postId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');

  async function load() {
    try {
      const r = await axios.get(`${API}/posts/${postId}/comments`);
      setComments(r.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function add() {
    try {
      await axios.post(
        `${API}/posts/${postId}/comments`,
        { body: text },
        { headers: { Authorization: 'Bearer ' + localStorage.token } }
      );
      setText('');
      await load();
    } catch (e) {
      console.error(e);
      alert('Comment failed');
    }
  }

  useEffect(() => {
    load();
  }, [postId]);

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Comments</div>
      {comments.length === 0 && <div className="badge">Be the first to comment.</div>}
      {comments.map((c) => (
        <div key={c.id} style={{ margin: '6px 0' }}>
          <div className="badge">
            <b>{c.author_name || 'Member'}</b> • {new Date(c.created_at).toLocaleString()}
          </div>
          <div>{c.body}</div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
        />
        <button className="button" onClick={add}>Send</button>
      </div>
    </div>
  );
}

/* ---------- Post ---------- */
function Post({ p, refresh }) {
  async function like() {
    try {
      await axios.post(
        `${API}/posts/${p.id}/like`,
        {},
        { headers: { Authorization: 'Bearer ' + localStorage.token } }
      );
      refresh();
    } catch (e) {
      console.error(e);
    }
  }
  return (
    <Section>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <img
          src={p.author_avatar || 'https://via.placeholder.com/40?text=🙂'}
          alt=""
          width={40}
          height={40}
          style={{ borderRadius: '50%' }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>{p.author_name || 'Member'}</div>
          <div className="badge">{new Date(p.created_at).toLocaleString()}</div>
        </div>
      </div>
      {p.body && <div style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{p.body}</div>}
      {p.image_url && (
        <img
          src={p.image_url}
          alt=""
          style={{ maxWidth: '100%', marginTop: 8, borderRadius: 8 }}
        />
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
        <button className="button ghost" onClick={like}>👍 Like</button>
        <span className="badge">
          {p.likes_count || 0} likes • {p.comments_count || 0} comments
        </span>
      </div>
      <Comments postId={p.id} />
    </Section>
  );
}

/* ---------- Profile ---------- */
function Profile({ user, setUser }) {
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [bio, setBio] = useState(user?.bio || '');

  async function save() {
    try {
      const r = await axios.patch(
        API + '/me',
        { name, username, avatar_url: avatar, bio },
        { headers: { Authorization: 'Bearer ' + localStorage.token } }
      );
      setUser(r.data.user);
      alert('Profile saved.');
    } catch (e) {
      console.error(e);
      alert('Save failed');
    }
  }

  return (
    <Section title="Your Profile">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <img
          src={avatar || 'https://via.placeholder.com/80?text=🙂'}
          width={80}
          height={80}
          style={{ borderRadius: '50%' }}
        />
        <div style={{ flex: 1 }}>
          <input
            className="input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="input"
            placeholder="Avatar URL"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />
          <textarea
            className="textarea"
            placeholder="Bio (your healing modalities, background…)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
          <button className="button" onClick={save}>Save Profile</button>
        </div>
      </div>
    </Section>
  );
}

/* ---------- About & Guidelines ---------- */
function About() {
  return (
    <Section title="About Made to Heal">
      <p>
        <b>Made to Heal</b> is a welcoming community for healers, practitioners, and anyone
        seeking well-being. Share insights, ask questions, and connect with others on their
        healing journeys.
      </p>
      <ul>
        <li>Share posts and reflections</li>
        <li>Offer supportive comments and encouragement</li>
        <li>Discover practitioners and modalities</li>
        <li>Learn from the community’s lived wisdom</li>
      </ul>
      <p>Thank you for helping us keep this space kind, helpful, and grounded.</p>
    </Section>
  );
}

function Guidelines() {
  return (
    <Section title="Community Guidelines">
      <ol>
        <li>
          <b>Lead with care.</b> Speak from your own experience; avoid medical claims or
          guarantees.
        </li>
        <li>
          <b>Be respectful.</b> No harassment, hate, or shaming. Disagreement is okay—
          disrespect isn’t.
        </li>
        <li>
          <b>Protect privacy.</b> Don’t share others’ personal info without consent.
        </li>
        <li>
          <b>No spam or self-promotion overload.</b> Share value first; promos should be
          relevant and occasional.
        </li>
        <li>
          <b>Safety first.</b> Report posts that may harm or exploit. Moderators may remove
          content or accounts.
        </li>
      </ol>
      <p>
        By participating, you agree to these guidelines and our intention to nurture a safe,
        supportive space.
      </p>
    </Section>
  );
}

/* ---------- App (default export) ---------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('feed');

  async function fetchUser() {
    if (!localStorage.token) return;
    try {
      const r = await axios.get(API + '/me', {
        headers: { Authorization: 'Bearer ' + localStorage.token },
      });
      setUser(r.data.user);
    } catch (e) {
      console.log('no user');
    }
  }

  async function fetchPosts() {
    try {
      const r = await axios.get(API + '/feed', {
        headers: { Authorization: 'Bearer ' + localStorage.token },
      });
      setPosts(r.data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { fetchUser(); }, []);
  useEffect(() => { if (user) fetchPosts(); }, [user]);

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setTab('feed');
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '20px auto',
        fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        padding: '0 12px',
      }}
    >
      <Header user={user} onLogout={logout} setTab={setTab} tab={tab} />
      {!user ? (
        <Auth onAuth={(u) => { setUser(u); setTab('feed'); }} />
      ) : (
        <>
          {tab === 'feed' && (
            <>
              <Composer onPosted={fetchPosts} />
              {posts.map((p) => (
                <Post key={p.id} p={p} refresh={fetchPosts} />
              ))}
            </>
          )}
          {tab === 'profile' && <Profile user={user} setUser={setUser} />}
          {tab === 'about' && <About />}
          {tab === 'guidelines' && <Guidelines />}
        </>
      )}
    </div>
  );
}
