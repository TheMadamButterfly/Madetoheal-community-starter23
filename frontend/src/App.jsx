import React, {useEffect, useState} from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

/* ---------- Small UI helpers ---------- */
function Section({title, children}) {
  return (
    <div className="card" style={{margin:'12px 0'}}>
      {title && <h3 style={{marginTop:0}}>{title}</h3>}
      {children}
    </div>
  );
}

function Header({user, onLogout, setTab, tab}) {
  const TabBtn = ({id, label}) => (
    <button
      className={`button ghost`}
      onClick={() => setTab(id)}
      style={{opacity: tab===id ? 1 : 0.7}}
    >
      {label}
    </button>
  );
  return (
    <header className="header">
      <div>
        <div style={{fontSize:22, fontWeight:700}}>🌿 Made to Heal — Community</div>
        <div className="badge">A supportive space for healers, practitioners, and the community.</div>
      </div>
      <div className="nav">
        <TabBtn id="feed" label="Feed" />
        <TabBtn id="profile" label="Profile" />
        <TabBtn id="about" label="About" />
        <TabBtn id="guidelines" label="Guidelines" />
        {user && (
          <button className="button" onClick={onLogout} style={{marginLeft:8}}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

/* ---------- Auth ---------- */
function Auth({onAuth}){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [name,setName] = useState('');
  const [mode,setMode] = useState('login');

  async function submit(){
    try{
      if(mode==='login'){
        const r = await axios.post(API+'/auth/login',{email,password});
        localStorage.token = r.data.token;
        onAuth(r.data.user);
      }else{
        const r = await axios.post(API+'/auth/register',{email,password,name});
        localStorage.token = r.data.token;
        onAuth(r.data.user);
      }
    }catch(e){
      const msg = e?.response?.data?.error || e.message || 'Auth error';
      alert(msg);
      console.error(e?.response?.data || e);
    }
  }

  return (
    <Section title={mode==='login'?'Login':'Create your account'}>
      <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      {mode==='register' && (
        <input className="input" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
      )}
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <button className="button" onClick={submit}>{mode==='login'?'Login':'Create'}</button>
        <button className="button ghost" onClick={()=>setMode(mode==='login'?'register':'login')}>
          {mode==='login'?'Need an account? Register':'Have an account? Login'}
        </button>
      </div>
    </Section>
  );
}

/* ---------- Composer ---------- */
function Composer({onPosted}) {
  const [text,setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [busy, setBusy] = useState(false);

  async function post(){
    try{
      setBusy(true);
      await axios.post(API+'/posts',
        { body: text, image_url: imageUrl || null, visibility },
        { headers: { Authorization: 'Bearer '+localStorage.token }}
      );
      setText(''); setImageUrl(''); setVisibility('public');
      onPosted();
    }catch(e){ alert('Post failed'); console.error(e); }
    finally { setBusy(false); }
  }

  return (
    <Section title="Share something with the community">
      <textarea className="textarea" value={text} onChange={e=>setText(e.target.value)} placeholder="What would you like to share?" rows={4} />
      <input className="input" placeholder="Optional image URL" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
        <label className="badge">Visibility</label>
        <select className="select" value={visibility} onChange={e=>setVisibility(e.target.value)} style={{maxWidth:200}}>
          <option value="public">Public</option>
          <option value="members">Members</option>
        </select>
        <button className="button" onClick={post} disabled={busy} style={{marginLeft:'auto'}}>
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>
    </Section>
  );
}

/* ---------- Comments ---------- */
function Comments({postId}) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  async function load() {
    try{
      const r = await axios.get(API+`/posts/${postId}/comments`);
      setComments(r.data);
    }catch(e){ console.error(e); }
  }
  async function add() {
    try{
      await axios.post(API+`/posts/${postId}/comment
