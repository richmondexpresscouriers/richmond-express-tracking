"use client";

import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function HomePage() {
const [trackingNumber, setTrackingNumber] = useState("");
const [delivery, setDelivery] = useState(null);
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

async function trackDelivery(e) {
e.preventDefault();

setLoading(true);
setMessage("");
setDelivery(null);

const number = trackingNumber.trim().toUpperCase();

if (!number) {
setMessage("Please enter a tracking number.");
setLoading(false);
return;
}

const { data, error } = await supabase
.from("Deliveries")
.select("*")
.eq("tracking_number", number)
.maybeSingle();

if (error) {
setMessage("Error: " + error.message);
} else if (!data) {
setMessage("Tracking number not found.");
} else {
setDelivery(data);
}

setLoading(false);
}

const stages = [
"Booked",
"Collected",
"In Transit",
"Delivered",
];

const currentStageIndex = delivery
? stages.indexOf(delivery.status)
: 0;

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
maxWidth: "700px",
margin: "0 auto",
}}
>
<h1>Richmond Express Couriers</h1>

<p>Track your delivery</p>

<form onSubmit={trackDelivery}>
<input
type="text"
value={trackingNumber}
onChange={(e) => setTrackingNumber(e.target.value)}
placeholder="REC-1001"
style={{
width: "100%",
padding: "15px",
boxSizing: "border-box",
fontSize: "16px",
}}
/>

<button
type="submit"
disabled={loading}
style={{
width: "100%",
padding: "15px",
marginTop: "10px",
background: "#ff4b3e",
color: "white",
border: "none",
fontSize: "16px",
fontWeight: "bold",
cursor: "pointer",
}}
>
{loading ? "Tracking..." : "Track Delivery"}
</button>
</form>

{message && (
<p
style={{
marginTop: "25px",
fontWeight: "bold",
}}
>
{message}
</p>
)}

{delivery && (
<div
style={{
marginTop: "25px",
padding: "20px",
border: "1px solid #444",
}}
>
<h2>{delivery.tracking_number}</h2>

<p>
<strong>Status:</strong> {delivery.status}
</p>

<div
style={{
display: "flex",
justifyContent: "space-between",
marginTop: "25px",
gap: "10px",
fontWeight: "bold",
}}
>
{stages.map((stage, index) => (
<div
key={stage}
style={{
flex: 1,
textAlign: "center",
opacity:
index <= currentStageIndex ? 1 : 0.5,
}}
>
{stage}
{index <= currentStageIndex ? " ✓" : ""}
</div>
))}
</div>

<div
style={{
height: "6px",
background: "#555",
marginTop: "10px",
position: "relative",
}}
>
<div
style={{
height: "100%",
background: "#ff4b3e",
width:
currentStageIndex === 0
? "25%"
: currentStageIndex === 1
? "50%"
: currentStageIndex === 2
? "75%"
: "100%",
}}
/>
</div>

<div style={{ marginTop: "25px" }}>
<p>
<strong>Collection:</strong>{" "}
{delivery.collection_address}
</p>

<p>
<strong>Delivery:</strong>{" "}
{delivery.delivery_address}
</p>

{delivery.estimated_delivery && (
<p>
<strong>Estimated delivery:</strong>{" "}
{new Date(
delivery.estimated_delivery
).toLocaleString("en-GB")}
</p>
)}

{delivery.status === "Delivered" &&
delivery.delivered_at && (
<p>
<strong>Delivered:</strong>{" "}
{new Date(
delivery.delivered_at
).toLocaleString("en-GB")}
</p>
)}

{delivery.status === "Delivered" &&
delivery.received_by && (
<p>
<strong>Received by:</strong>{" "}
{delivery.received_by}
</p>
)}

{delivery.status === "Delivered" &&
delivery.pod_photo && (
<div style={{ marginTop: "20px" }}>
<p>
<strong>Proof of Delivery:</strong>
</p>

<img
src={delivery.pod_photo}
alt="Proof of delivery"
style={{
width: "100%",
maxHeight: "400px",
objectFit: "contain",
borderRadius: "8px",
border: "1px solid #555",
}}
/>

<p style={{ marginTop: "10px" }}>
<a
href={delivery.pod_photo}
target="_blank"
rel="noreferrer"
style={{
color: "white",
textDecoration: "underline",
}}
>
Open full POD photo
</a>
</p>
</div>
)}
</div>

<p
style={{
textAlign: "center",
marginTop: "35px",
fontWeight: "bold",
}}
>
FAST. RELIABLE. DELIVERED.
</p>
</div>
)}
</div>
</main>
);
}
