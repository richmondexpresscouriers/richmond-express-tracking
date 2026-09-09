"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

async function handleLogin(e) {
e.preventDefault();

setLoading(true);
setMessage("");

const { error } = await supabase.auth.signInWithPassword({
email: email.trim(),
password,
});

if (error) {
setMessage("Login failed: " + error.message);
setLoading(false);
return;
}

router.push("/admin");
}

return (
<main
style={{
minHeight: "100vh",
backgroundColor: "#222",
color: "#fff",
padding: "40px 20px",
fontFamily: "Arial, sans-serif",
}}
>
<div
style={{
width: "100%",
maxWidth: "500px",
margin: "0 auto",
}}
>
<h1
style={{
fontSize: "32px",
marginBottom: "10px",
}}
>
Richmond Express Couriers
</h1>

<h2
style={{
fontSize: "22px",
marginBottom: "30px",
}}
>
Admin Login
</h2>

<form onSubmit={handleLogin}>
<label
style={{
display: "block",
marginBottom: "8px",
}}
>
Email
</label>

<input
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
required
autoComplete="email"
style={{
width: "100%",
boxSizing: "border-box",
padding: "15px",
marginBottom: "20px",
fontSize: "16px",
}}
/>

<label
style={{
display: "block",
marginBottom: "8px",
}}
>
Password
</label>

<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
required
autoComplete="current-password"
style={{
width: "100%",
boxSizing: "border-box",
padding: "15px",
marginBottom: "25px",
fontSize: "16px",
}}
/>

<button
type="submit"
disabled={loading}
style={{
width: "100%",
padding: "16px",
backgroundColor: "#ff4b3e",
color: "#fff",
border: "none",
fontSize: "18px",
fontWeight: "bold",
cursor: "pointer",
}}
>
{loading ? "Signing in..." : "Sign In"}
</button>
</form>

{message && (
<p
style={{
marginTop: "20px",
}}
>
{message}
</p>
)}
</div>
</main>
);
}
