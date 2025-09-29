import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

function App() {
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  async function login() {
    try {
      const res = await axios.post(API + '/auth/login', { email, password });
      localStorage.token = res.data.token;
      setUser(res.data.user);
      loadFeed();
    } catch (e) {
      alert('Login failed');
    }
  }

  async function register() {
    try {
      const res = await axios.post(API + '/auth/register', { email, password, name });
      localStorage.token = res.data.token;
      setUser(res.data.user);
      loadFeed();
    } catch (e) {
      alert('Register failed');
    }
  }

  async function loadFeed() {
    try {
      const res = await axios.get(API + '/feed', {
        headers: { Authorization: 'Bearer ' + localStorage.token },
      });
      setFeed(res.data);
    } catch (e) {
      console.error(e);
    }
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto' }} className="card">
        <h2 style={{ marginTop: 0 }}>Made to Heal Community</h2>
        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div style={{ marginTop: 12 }}>
          <button className="button" onClick={login}>
            Login
          </button>{' '}
          <button className="button ghost" onClick={register}>
            Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', padding: 10 }}>
      <header className="header">
        <h2 style={{ margin: 0 }}>Welcome, {user.name}</h2>
        <div className="nav">
          <button className="button ghost" onClick={() => { localStorage.removeItem('token'); setUser(null); }}>
            Logout
          </button>
        </div>
      </header>

      <Composer onPosted={loadFeed} />

      <div style={{ marginTop: 20 }}>
        {feed.map((post) => (
          <div key={post.id} className="card" style={{ marginBottom: 10 }}>
            <p>{post.body}</p>
            {post.image_url && (
              <img
                src={post.image_url}
                alt="post"
                style={{ maxWidth: '100%', borderRadius: 10, marginTop: 8 }}
              />
            )}
            <div className="badge">by {post.author_name}</div>
            <div style={{ marginTop: 8 }}>
              <button className="button ghost">Like ({post.likes_count || 0})</button>{' '}
              <button className="button ghost">Comment ({post.comments_count || 0})</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        { body: text, image_url: imageUrl, visibility },
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
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Share something with the community</h3>
      <textarea
        className="textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What would you like to share?"
        rows={4}
      />
      <input
        className="input"
        placeholder="Image URL (optional)"
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
        <button className="button" onClick={post} disabled={busy} style={{ marginLeft: 'auto' }}>
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}

export default App;
