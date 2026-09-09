"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL,
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default function Home() {
const [trackingNumber, setTrackingNumber] = useState("");
const [delivery, setDelivery] = useState(null);
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

async function trackDelivery(e) {
e.preventDefault();

setLoading(true);
setError("");
setDelivery(null);

const number = trackingNumber.trim().toUpperCase();

if (!number) {
setError("Please enter a tracking number.");
setLoading(false);
return;
}

const { data, error } = await supabase
.from("Deliveries")
.select("*")
.eq("tracking_number", number)
.maybeSingle();

if (error) {
setError("Something went wrong. Please try again.");
setLoading(false);
return;
}

if (!data) {
setError("Tracking number not found.");
setLoading(false);
return;
}

setDelivery(data);
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
: -1;

function formatDate(value) {
if (!value) return "";

return new Date(value).toLocaleString("en-GB", {
day: "2-digit",
month: "2-digit",
year: "numeric",
hour: "2-digit",
minute: "2-digit",
});
}

return (
<main
style={{
minHeight: "100vh",
backgroundColor: "#1f1f1f",
color: "#ffffff",
padding: "20px",
fontFamily: "Arial, sans-serif",
}}
>
<div
style={{
width: "100%",
maxWidth: "700px",
margin: "0 auto",
}}
>
<div
style={{
textAlign: "center",
marginBottom: "30px",
}}
>
<h1
style={{
fontSize: "34px",
marginBottom: "8px",
}}
>
Richmond Express Couriers
</h1>

<p
style={{
fontSize: "18px",
marginTop: "0",
}}
>
Track Your Delivery
</p>
</div>

<form
onSubmit={trackDelivery}
style={{
backgroundColor: "#2b2b2b",
padding: "20px",
borderRadius: "10px",
marginBottom: "25px",
}}
>
<label
style={{
display: "block",
marginBottom: "8px",
fontWeight: "bold",
}}
>
Tracking Number
</label>

<input
type="text"
placeholder="Example: REC-1006"
value={trackingNumber}
onChange={(e) =>
setTrackingNumber(e.target.value)
}
style={{
width: "100%",
boxSizing: "border-box",
padding: "14px",
fontSize: "17px",
marginBottom: "14px",
borderRadius: "6px",
border: "1px solid #ccc",
}}
/>

<button
type="submit"
disabled={loading}
style={{
width: "100%",
padding: "15px",
border: "none",
borderRadius: "6px",
backgroundColor: "#e53935",
color: "#ffffff",
fontSize: "17px",
fontWeight: "bold",
cursor: "pointer",
}}
>
{loading ? "Tracking..." : "Track Delivery"}
</button>
</form>

{error && (
<div
style={{
backgroundColor: "#333",
padding: "15px",
borderRadius: "8px",
marginBottom: "20px",
}}
>
{error}
</div>
)}

{delivery && (
<div
style={{
backgroundColor: "#2b2b2b",
padding: "20px",
borderRadius: "10px",
}}
>
<h2
style={{
marginTop: "0",
}}
>
{delivery.tracking_number}
</h2>

<p
style={{
fontSize: "18px",
}}
>
<strong>Status:</strong> {delivery.status}
</p>

<div
style={{
marginTop: "25px",
marginBottom: "30px",
}}
>
{stages.map((stage, index) => {
const complete =
index <= currentStageIndex;

return (
<div
key={stage}
style={{
display: "flex",
alignItems: "center",
marginBottom: "14px",
}}
>
<div
style={{
width: "30px",
height: "30px",
borderRadius: "50%",
backgroundColor: complete
? "#e53935"
: "#555",
display: "flex",
alignItems: "center",
justifyContent: "center",
marginRight: "12px",
fontWeight: "bold",
}}
>
{complete ? "✓" : ""}
</div>

<span
style={{
fontSize: "17px",
fontWeight: complete
? "bold"
: "normal",
}}
>
{stage}
</span>
</div>
);
})}
</div>

{delivery.collection_address && (
<p>
<strong>Collection:</strong>{" "}
{delivery.collection_address}
</p>
)}

{delivery.delivery_address && (
<p>
<strong>Delivery:</strong>{" "}
{delivery.delivery_address}
</p>
)}

{delivery.estimated_delivery && (
<p>
<strong>Estimated delivery:</strong>{" "}
{formatDate(
delivery.estimated_delivery
)}
</p>
)}

{delivery.delivered_at && (
<p>
<strong>Delivered:</strong>{" "}
{formatDate(delivery.delivered_at)}
</p>
)}

{delivery.received_by && (
<p>
<strong>Received by:</strong>{" "}
{delivery.received_by}
</p>
)}

{delivery.pod_photo && (
<div
style={{
marginTop: "25px",
}}
>
<h3>Proof of Delivery</h3>

<img
src={delivery.pod_photo}
alt="Proof of delivery"
style={{
width: "100%",
maxWidth: "500px",
borderRadius: "10px",
display: "block",
marginTop: "12px",
}}
/>
</div>
)}
</div>
)}
</div>
</main>
);
}
