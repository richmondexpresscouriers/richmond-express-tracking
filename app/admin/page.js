"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminPage() {
const [trackingNumber, setTrackingNumber] = useState("");
const [status, setStatus] = useState("Booked");
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

async function updateDelivery(e) {
e.preventDefault();
setLoading(true);
setMessage("");

const number = trackingNumber.trim().toUpperCase();

if (!number) {
setMessage("Enter a tracking number.");
setLoading(false);
return;
}

const updates = { status };

if (status === "Delivered") {
updates.delivered_at = new Date().toISOString();
} else {
updates.delivered_at = null;
}

const { data, error } = await supabase
.from("deliveries")
.update(updates)
.eq("tracking_number", number)
.select();

if (error) {
setMessage("Error: " + error.message);
} else if (!data || data.length === 0) {
setMessage("Tracking number not found.");
} else {
setMessage(number + " updated to " + status);
}

setLoading(false);
}

return (
<main
style={{
minHeight: "100vh",
background: "#222",
color: "white",
padding: "40px 20px",
}}
>
<div
style={{
maxWidth: "600px",
margin: "0 auto",
background: "#444",
padding: "30px",
borderRadius: "15px",
}}
>
<h1>Richmond Express Couriers</h1>
<h2>Delivery Admin</h2>

<form onSubmit={updateDelivery}>
<p>Tracking number</p>

<input
value={trackingNumber}
onChange={(e) => setTrackingNumber(e.target.value)}
placeholder="REC-1001"
style={{
width: "100%",
padding: "15px",
fontSize: "16px",
boxSizing: "border-box",
}}
/>

<p>Status</p>

<select
value={status}
onChange={(e) => setStatus(e.target.value)}
style={{
width: "100%",
padding: "15px",
fontSize: "16px",
boxSizing: "border-box",
}}
>
<option>Booked</option>
<option>Collected</option>
<option>In Transit</option>
<option>Delivered</option>
</select>

<button
type="submit"
disabled={loading}
style={{
width: "100%",
padding: "15px",
marginTop: "25px",
background: "#ff4b3e",
color: "white",
border: "none",
fontSize: "16px",
fontWeight: "bold",
cursor: "pointer",
}}
>
{loading ? "Updating..." : "Update Delivery"}
</button>
</form>

{message && <p style={{ marginTop: "25px" }}>{message}</p>}
</div>
</main>
);
}
