import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateStoreLanding() {
  const navigate = useNavigate();
  const start = () => navigate('/auth?next=/seller-onboarding');

  return (
    <div style={{minHeight:'100vh', display:'grid', placeItems:'center', background:'linear-gradient(180deg,#eef2ff 0%,#e0f2fe 50%,#e6fffb 100%)'}}>
      <div style={{background:'rgba(255,255,255,.95)', borderRadius:20, padding:32, width:'min(560px,90vw)', textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,.06)'}}>
        <h1 style={{margin:'0 0 8px'}}>Create your free ShopLink store</h1>
        <p style={{opacity:.8, margin:'0 0 16px'}}>No credit card. Add up to 25 products during beta.</p>
        <button onClick={start} style={{border:'none', background:'linear-gradient(135deg,#5a6bff,#67d1ff)', color:'#fff', padding:'14px 22px', borderRadius:12, fontWeight:900, cursor:'pointer'}}>
          Get started
        </button>
      </div>
    </div>
  );
}