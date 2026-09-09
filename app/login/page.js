"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);
const router = useRouter();

async function handleLogin(e) {
e.preventDefault();
setLoading(true);
setMessage("");

const { error } = await supabase.auth.signInWithPassword({
email,
password,
});

if (error) {
setMessage("Incorrect email or password.");
setLoading(false);
return;
}

router.push("/admin");
}

return (
<main
style={{
minHeight: "100vh",
background: "#222",
color: "white",
display: "flex",
justifyContent: "center",
alignItems: "center",
padding: "20px",
}}
>
<div
style={{
width: "100%",
maxWidth: "560px",
background: "#333",
padding: "35px",
borderRadius: "18px",
}}
>
<h1>Richmond Express Couriers</h1>
<h2>Admin Login</h2>

<form onSubmit={handleLogin}>
<label>Email</label>
<input
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
required
style={{
width: "100%",
padding: "15px",
margin: "8px 0 20px",
boxSizing: "border-box",
}}
/>

<label>Password</label>
<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
required
style={{
width: "100%",
padding: "15px",
margin: "8px 0 20px",
boxSizing: "border-box",
}}
/>

<button
type="submit"
disabled={loading}
style={{
width: "100%",
padding: "15px",
background: "#e25b45",
color: "white",
border: "none",
fontWeight: "bold",
cursor: "pointer",
}}
>
{loading ? "Signing in..." : "Login"}
</button>

{message && <p>{message}</p>}
</form>
</div>
</main>
);
}
