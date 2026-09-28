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

const stages = ["Booked", "Collected", "In Transit", "Delivered"];

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

function downloadPOD() {
if (!delivery) return;

const podWindow = window.open("", "_blank");

if (!podWindow) {
alert("Please allow pop-ups to download the proof of delivery.");
return;
}

const deliveredTime = delivery.delivered_at
? formatDate(delivery.delivered_at)
: "Not recorded";

const estimatedTime = delivery.estimated_delivery
? formatDate(delivery.estimated_delivery)
: "Not recorded";

podWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>${delivery.tracking_number} - Proof of Delivery</title>

<style>
* {
box-sizing: border-box;
}

body {
font-family: Arial, sans-serif;
margin: 0;
padding: 40px;
color: #111111;
background: #ffffff;
}

.pod {
max-width: 800px;
margin: auto;
}

.header {
border-bottom: 4px solid #e53935;
padding-bottom: 20px;
margin-bottom: 30px;
}

.company {
font-size: 30px;
font-weight: bold;
margin: 0;
}

.subtitle {
color: #e53935;
font-size: 18px;
font-weight: bold;
margin-top: 6px;
}

.reference {
margin-top: 25px;
padding: 15px;
background: #f3f3f3;
border-radius: 8px;
}

.row {
padding: 11px 0;
border-bottom: 1px solid #dddddd;
}

.label {
font-weight: bold;
display: inline-block;
min-width: 180px;
}

.status {
color: #e53935;
font-weight: bold;
}

.photo-section {
margin-top: 30px;
}

.photo-section h2 {
font-size: 20px;
}

.photo {
display: block;
width: 100%;
max-width: 550px;
max-height: 500px;
object-fit: contain;
border: 1px solid #dddddd;
border-radius: 8px;
margin-top: 15px;
}

.confirmation {
margin-top: 30px;
padding: 15px;
border-left: 4px solid #e53935;
background: #f7f7f7;
}

.footer {
margin-top: 45px;
padding-top: 20px;
border-top: 1px solid #dddddd;
font-size: 12px;
color: #666666;
}

.tagline {
font-weight: bold;
margin-top: 6px;
}

@media print {
body {
padding: 20px;
}
}
</style>
</head>

<body>
<div class="pod">

<div class="header">
<p class="company">Richmond Express Couriers</p>
<div class="subtitle">PROOF OF DELIVERY</div>
</div>

<div class="reference">
<strong>Tracking Number:</strong>
${delivery.tracking_number || ""}
</div>

<div class="row">
<span class="label">Delivery Status</span>
<span class="status">${delivery.status || ""}</span>
</div>

<div class="row">
<span class="label">Collection</span>
${delivery.collection_address || "Not recorded"}
</div>

<div class="row">
<span class="label">Delivery</span>
${delivery.delivery_address || "Not recorded"}
</div>

<div class="row">
<span class="label">Estimated Delivery</span>
${estimatedTime}
</div>

<div class="row">
<span class="label">Delivered</span>
${deliveredTime}
</div>

<div class="row">
<span class="label">Received By</span>
${delivery.received_by || "Not recorded"}
</div>

${
delivery.pod_photo
? `
<div class="photo-section">
<h2>Photographic Proof of Delivery</h2>

<img
class="photo"
src="${delivery.pod_photo}"
alt="Proof of Delivery"
/>
</div>
`
: ""
}

<div class="confirmation">
This document confirms that the delivery shown above
was completed by Richmond Express Couriers.
</div>

<div class="footer">
Richmond Express Couriers

<div class="tagline">
FAST. RELIABLE. DELIVERED.
</div>
</div>

</div>

<script>
window.onload = function() {
setTimeout(function() {
window.print();
}, 800);
};
</script>

</body>
</html>
`);

podWindow.document.close();
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
<a href="https://www.richmondexpresscouriers.co.uk/" aria-label="Richmond Express Couriers home">
<img src="https://images.squarespace-cdn.com/content/v1/6a7c5fbc239cd3610d31d9dd/c463ef62-5223-466c-bd2b-9e4dc583aaf4/B61D1603-CF1C-49A0-940C-BBB395E719A9.png?format=750w" alt="Richmond Express Couriers" style={{width: "260px", maxWidth: "100%", height: "auto", margin: "12px auto 8px"}} />
</a>
<p style={{color: "#ffffff", fontSize: "16px", margin: "8px 0 24px"}}>Your delivery. Our priority.</p>
<a href="https://www.richmondexpresscouriers.co.uk/" style={{color: "#ffffff", textUnderlineOffset: "4px"}}>Back to our website</a>
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

<style>{`
body { margin: 0; background: #09090b; }
main { box-sizing: border-box; min-height: 100svh !important; background: radial-gradient(ellipse at 50% 0%, #35121c 0%, #101014 42%, #09090b 80%) !important; padding: 28px 20px 56px !important; font-family: Arial, sans-serif; }
main > div { max-width: 640px !important; }
main > div > div:first-child { display: flex; flex-direction: column; align-items: center; margin-bottom: 32px !important; }
main > div > div:first-child > a:first-child img { width: 220px !important; border-radius: 12px; margin: 20px auto 10px !important; }
main > div > div:first-child > p { color: #b7b7c2 !important; font-size: 14px !important; margin: 6px 0 0 !important; }
main > div > div:first-child > a:nth-of-type(2) { order: -1; align-self: flex-start; color: #b7b7c2 !important; font-size: 13px; text-decoration: none; padding: 8px 0; }
main > div > div:first-child > a:nth-of-type(2)::before { content: "←  "; }
main > div > div:first-child > h1, main > div > div:first-child > p:last-child { display: none; }
.rec-intro { text-align: center; margin-bottom: 28px; }
.rec-intro h1 { font-size: clamp(32px, 7vw, 46px); letter-spacing: -1.5px; line-height: 1.1; margin: 0 0 14px; }
.rec-intro p { color: #b7b7c2; line-height: 1.65; font-size: 16px; max-width: 430px; margin: 0 auto; }
main form { background: linear-gradient(145deg, #202027, #16161b) !important; border: 1px solid #37313b; border-top: 3px solid #ed1746; border-radius: 20px !important; padding: 30px !important; box-shadow: 0 20px 65px #0005; margin-bottom: 20px !important; }
main form label { font-size: 14px; margin-bottom: 12px !important; }
main form input { background: #0f0f14; color: #fff; border: 1px solid #51515d !important; border-radius: 10px !important; padding: 18px 16px !important; margin-bottom: 16px !important; min-height: 58px; }
main form input::placeholder { color: #92929f; font-size: 15px; }
main form input:focus { outline: 2px solid #ff496d; outline-offset: 3px; }
main button { background: #db123c !important; border-radius: 10px !important; min-height: 56px; transition: background .15s ease; }
main button:hover:not(:disabled) { background: #f0204c !important; }
main button:disabled { opacity: .65; cursor: wait !important; }
main a:focus-visible, main button:focus-visible { outline: 2px solid #ff7d98; outline-offset: 4px; }
.rec-help { text-align: center; color: #a8a8b5; font-size: 13px; line-height: 1.8; margin: 22px 0 30px; }
.rec-help a { color: #fff; text-underline-offset: 4px; }
@media(max-width: 480px) { main { padding: 16px 18px 36px !important; } main form { padding: 24px 20px !important; } main > div > div:first-child { margin-bottom: 26px !important; } }
`}</style>
<section className="rec-intro" aria-labelledby="tracking-title">
<h1 id="tracking-title">Track your delivery<span style={{color: "#ed1746"}}>.</span></h1>
<p>From collection to your doorstep. Enter your tracking number for the latest delivery update.</p>
</section>
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

<input aria-label="Tracking number" autoCapitalize="characters" spellCheck={false}
type="text"
placeholder="Enter your tracking number"
value={trackingNumber}
onChange={(e) => setTrackingNumber(e.target.value)}
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
<p className="rec-help">Need a hand with your delivery?<br /><a href="tel:07368922515">Call 07368 922515</a><span aria-hidden="true"> &nbsp;·&nbsp; </span><a href="https://wa.me/447368922515">WhatsApp us</a></p>

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
<h2 style={{ marginTop: "0" }}>
{delivery.tracking_number}
</h2>

<p style={{ fontSize: "18px" }}>
<strong>Status:</strong> {delivery.status}
</p>

<div
style={{
marginTop: "25px",
marginBottom: "30px",
}}
>
{stages.map((stage, index) => {
const complete = index <= currentStageIndex;

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
{formatDate(delivery.estimated_delivery)}
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
<div style={{ marginTop: "25px" }}>
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

{delivery.status === "Delivered" && (
<button
onClick={downloadPOD}
style={{
width: "100%",
maxWidth: "500px",
padding: "15px",
marginTop: "25px",
backgroundColor: "#e53935",
color: "#ffffff",
border: "none",
borderRadius: "8px",
fontSize: "16px",
fontWeight: "bold",
cursor: "pointer",
}}
>
DOWNLOAD PROOF OF DELIVERY
</button>
)}
</div>
)}
</div>
</main>
);
}
