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
          </button
