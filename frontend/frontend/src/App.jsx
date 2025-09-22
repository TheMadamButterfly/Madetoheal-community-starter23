import React, {useEffect, useState} from 'react';
import axios from 'axios';

const API = (import.meta.env.VITE_API_URL) || 'http://localhost:4000/api';

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
    }catch(e){ alert('Auth error'); console.error(e); }
  }
  return <div style={{border:'1px solid #ddd',padding:12}}>
    <h3>{mode==='login'?'Login':'Register'}</h3>
    <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><br/>
    <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} /><br/>
    {mode==='register' && <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />}<br/>
    <button onClick={submit}>{mode==='login'?'Login':'Create'}</button>
    <div style={{marginTop:8}}>
      <button onClick={()=>setMode(mode==='login'?'register':'login')}>Switch to {mode==='login'?'Register':'Login'}</button>
    </div>
  </div>;
}

function Composer({onPosted}) {
  const [text,setText] = useState('');
  async function post(){
    try{
      await axios.post(API+'/posts', { body: text }, { headers: { Authorization: 'Bearer '+localStorage.token }});
      setText('');
      onPosted();
    }catch(e){ alert('Post failed'); console.error(e); }
  }
  return <div style={{border:'1px solid #eee',padding:8,marginBottom:12}}>
    <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Share something..." rows={4} style={{width:'100%'}}></textarea>
    <button onClick={post}>Post</button>
  </div>;
}

function Post({p, refresh}) {
  async function like(){
    try{
      await axios.post(API+`/posts/${p.id}/like`, {}, { headers: { Authorization: 'Bearer '+localStorage.token }});
      refresh();
    }catch(e){ console.error(e); }
  }
  return <div style={{border:'1px solid #ddd',padding:12,marginBottom:8}}>
    <div style={{fontWeight:600}}>{p.author_name || p.author_id}</div>
    <div style={{color:'#666',fontSize:12}}>{new Date(p.created_at).toLocaleString()}</div>
    <div style={{marginTop:8}}>{p.body}</div>
    {p.image_url && <img src={p.image_url} alt="" style={{maxWidth:300,marginTop:8}} />}
    <div style={{marginTop:8}}>
      <button onClick={like}>Like</button>
    </div>
  </div>;
}

export default function App(){
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  async function fetchUser(){
    if(!localStorage.token) return;
    try{
      const r = await axios.get(API+'/me', { headers: { Authorization: 'Bearer '+localStorage.token }});
      setUser(r.data.user);
    }catch(e){ console.log('no user'); }
  }
  async function fetchPosts(){
    try{
      const r = await axios.get(API+'/feed', { headers: { Authorization: 'Bearer '+localStorage.token }});
      setPosts(r.data);
    }catch(e){ console.error(e); }
  }
  useEffect(()=>{ fetchUser(); fetchPosts(); }, []);
  return <div style={{maxWidth:800,margin:'20px auto',fontFamily:'Arial,Helvetica'}}>{
    user ? <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <strong>{user.name}</strong><div style={{fontSize:12}}>{user.email}</div>
        </div>
        <div>
          <button onClick={()=>{ localStorage.removeItem('token'); setUser(null); }}>Logout</button>
        </div>
      </div>
      <Composer onPosted={fetchPosts} />
      <div>
        {posts.map(p=> <Post key={p.id} p={p} refresh={fetchPosts} />)}
      </div>
    </> : <Auth onAuth={(u)=>{ setUser(u); fetchPosts(); }} />
  }</div>;
}
