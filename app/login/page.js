"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
const router = useRouter();
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const [capsLock, setCapsLock] = useState(false);
const [signedIn, setSignedIn] = useState(false);
useEffect(() => {
let active = true;
supabase.auth.getSession().then(({data}) => { if (active) setSignedIn(Boolean(data.session)); }).catch(() => {});
return () => { active = false; };
}, []);
async function handleLogin(e) {
e.preventDefault();
if (loading) return;
const form = new FormData(e.currentTarget);
setLoading(true);
setMessage("");
try {
const { error } = await supabase.auth.signInWithPassword({email: String(form.get("email") || "").trim(), password: String(form.get("password") || "")});
if (error) { setMessage(error.status === 429 ? "Too many attempts. Please wait a moment before trying again." : "We couldn’t sign you in. Check your email and password, then try again."); return; }
router.replace("/admin");
} catch { setMessage("Unable to connect. Check your internet connection and try again."); }
finally { setLoading(false); }
}
return <main className="rec-login">
<style>{"body{margin:0;background:#09090d}.rec-login{min-height:100svh;padding:28px 20px 36px;background:radial-gradient(ellipse at top,#30121f,transparent 650px),#09090d;color:#f8f6fa;font:16px/1.5 Arial,Helvetica,sans-serif}.rec-login *{box-sizing:border-box}.login-shell{max-width:440px;margin:auto}.rec-login .back{font-size:13px;color:#bdb5c3;text-decoration:none}.login-brand{text-align:center;margin:25px 0 24px}.login-brand img{display:block;margin:auto;border-radius:50%;object-fit:contain}.login-brand p{font-size:10px;letter-spacing:2px;font-weight:700;color:#c2b6c5;margin:16px 0 0}.login-card{border:1px solid #39303e;background:#18151e;border-radius:20px;padding:30px;box-shadow:0 20px 60px #0003}.rec-login .eyebrow{font-size:10px;color:#f681a0;font-weight:700;letter-spacing:1.8px;margin:0 0 10px}.rec-login h1{font-size:34px;line-height:1.15;letter-spacing:-1.1px;margin:0 0 12px}.rec-login h1 span,.rec-login .footer span{color:#ef315c}.rec-login .intro{color:#b8afc0;font-size:14px;margin:0 0 26px}.rec-login label{display:block;font-size:13px;font-weight:700;margin:0 0 9px}.rec-login input{width:100%;min-width:0;min-height:52px;border:1px solid #514656;border-radius:9px;padding:14px;background:#0d0c12;color:#fff;font:16px Arial;outline-offset:3px}.rec-login input[type=email]{margin-bottom:21px}.password-field{position:relative}.password-field input{padding-right:72px}.rec-login .reveal{position:absolute;right:5px;top:5px;bottom:5px;background:#292130;border:0;border-radius:5px;color:#f5b1c2;padding:0 12px;font-size:13px;cursor:pointer;min-width:56px}.rec-login .submit{margin-top:22px;min-height:52px;width:100%;border:1px solid #ef5679;border-radius:9px;color:white;background:#d71643;font-size:15px;font-weight:700;cursor:pointer}.rec-login .submit:hover{background:#eb2353}.rec-login .submit:disabled{opacity:.65;cursor:wait}.rec-login :is(input,button,a):focus-visible{outline:3px solid #ff91ae;outline-offset:3px}.rec-login .hint{color:#a79bad;font-size:12px;line-height:1.6;text-align:center;margin:15px 0 0}.rec-login .error{padding:12px 14px;border:1px solid #964559;background:#391b28;border-radius:8px;font-size:13px;margin:16px 0 0}.rec-login .caps{font-size:12px;color:#ffd38b;margin:8px 0 0}.rec-login .footer{font-size:10px;font-weight:700;letter-spacing:1.8px;text-align:center;color:#a99eae;margin:25px 0 0}.rec-login .session{background:#172b24;border:1px solid #36584a;border-radius:9px;padding:14px;margin-bottom:24px}.rec-login .session p{font-size:12px;color:#bdd9cb;margin:0 0 8px}.rec-login .session a{display:block;color:#a8e8c7;font-size:14px;font-weight:700;text-underline-offset:4px}@media(max-width:480px){.rec-login{padding:20px 18px 28px}.login-brand{margin:22px 0}.login-brand img{width:80px;height:80px}.login-card{padding:25px 22px}.rec-login h1{font-size:30px}}"}</style>
<div className="login-shell">
<a className="back" href="/">← Customer tracking</a>
<header className="login-brand"><img src="https://static1.squarespace.com/static/6a7c5fbc239cd3610d31d9dd/t/6abac2402aed9b11130ef609/1790624320552/logo.jpeg" width="96" height="96" alt="Richmond Express Couriers" /><p>RICHMOND EXPRESS COURIERS</p></header>
<section className="login-card" aria-labelledby="login-title"><p className="eyebrow">DELIVERY DASHBOARD</p><h1 id="login-title">Welcome back<span>.</span></h1><p className="intro">Sign in to manage your jobs and delivery updates.</p>
{signedIn && <div className="session"><p>You’re already signed in on this browser.</p><a href="/admin">Continue to dashboard →</a></div>}
<form onSubmit={handleLogin} aria-busy={loading}>
<label htmlFor="login-email">Email address</label><input id="login-email" name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com" onChange={()=>setMessage("")} />
<label htmlFor="login-password">Password</label><div className="password-field"><input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required aria-describedby={capsLock ? "caps-warning" : undefined} onKeyUp={e=>setCapsLock(e.getModifierState("CapsLock"))} onKeyDown={e=>setCapsLock(e.getModifierState("CapsLock"))} onBlur={()=>setCapsLock(false)} onChange={()=>setMessage("")} /><button className="reveal" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)}>{showPassword ? "Hide" : "Show"}</button></div>
{capsLock && <p className="caps" id="caps-warning">Caps Lock is on.</p>}
{message && <p className="error" role="alert">{message}</p>}
<button className="submit" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in →"}</button>
<p className="hint">Use your browser’s saved login to fill both fields quickly.</p>
</form></section><p className="footer">FAST. RELIABLE. <span>DELIVERED.</span></p>
</div></main>;
}
