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
setError("Enter your tracking reference, for example REC-1010. You’ll find it in your delivery confirmation.");
setLoading(false);
return;
}
try {
const { data, error } = await supabase.from("Deliveries").select("*").eq("tracking_number", number).maybeSingle();
if (error) throw error;
if (!data) {
setError("We couldn’t find that delivery. Check the reference in your confirmation, including the REC- prefix, and try again. If you’ve just booked, the tracking record may not be available yet.");
return;
}
setDelivery(data);
} catch {
setError("We couldn’t load your delivery update. Please try again in a moment, or contact us for help.");
} finally {
setLoading(false);
}
}

const estimatedDelivery = delivery?.estimated_delivery && !Number.isNaN(new Date(delivery.estimated_delivery).getTime()) ? delivery.estimated_delivery : null;
const estimatePassed = estimatedDelivery && new Date(estimatedDelivery).getTime() < Date.now();

const stages = ["Booked", "Collected", "In Transit", "Delivered"];

const currentStageIndex = delivery
? stages.indexOf(delivery.status)
: -1;

function formatDate(value) {
if (!value || Number.isNaN(new Date(value).getTime())) return "";

return new Date(value).toLocaleString("en-GB", {
day: "2-digit",
month: "2-digit",
year: "numeric",
hour: "2-digit",
minute: "2-digit",
timeZone: "Europe/London",
});
}

function escapeHtml(value) {
return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
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
<html lang="en">
<head>
<title>${escapeHtml(delivery.tracking_number)} - Proof of Delivery</title>

<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
*{box-sizing:border-box}body{font:14px/1.5 Arial,Helvetica,sans-serif;margin:0;padding:32px 24px;color:#20212a;background:#eef0f4}.pod{max-width:800px;margin:auto;background:#fff;border:1px solid #e0e2e7;border-radius:16px;padding:38px}.header{border-bottom:3px solid #d71643;padding-bottom:22px;margin-bottom:22px}.company{font-size:23px;font-weight:700;letter-spacing:-.5px;margin:0}.subtitle{color:#d71643;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-top:7px}.reference{margin:0 0 16px;padding:14px 16px;background:#f4f4f7;border-radius:8px;font-size:15px}.row{display:grid;grid-template-columns:155px 1fr;gap:20px;padding:11px 0;border-bottom:1px solid #e7e7ed;overflow-wrap:anywhere}.label{font-size:12px;font-weight:700;color:#71717e}.status{color:#167451;font-weight:700}.photo-section{margin-top:22px;break-inside:avoid}.photo-section h2{font-size:15px;margin:0 0 12px}.photo{display:block;width:100%;height:290px;object-fit:contain;background:#f7f7f9;border:1px solid #e0e0e7;border-radius:9px}.confirmation{margin-top:22px;padding:14px 16px;border-left:3px solid #d71643;background:#f7f7f9;font-size:12px;break-inside:avoid}.footer{display:flex;justify-content:space-between;gap:16px;margin-top:24px;padding-top:15px;border-top:1px solid #e7e7ed;font-size:10px;color:#777781}.tagline{font-weight:700;letter-spacing:.5px}.print-toolbar{max-width:800px;margin:0 auto 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:12px;color:#676775}.print-toolbar button{border:0;border-radius:8px;padding:12px 18px;color:#fff;background:#d71643;font-weight:700;cursor:pointer}@media(max-width:540px){body{padding:16px 12px}.pod{padding:24px 20px;border-radius:12px}.company{font-size:20px}.row{grid-template-columns:1fr;gap:4px}.photo{height:260px}.footer{flex-direction:column;gap:6px}.print-toolbar{align-items:flex-start}.print-toolbar span{max-width:170px}}@page{size:A4;margin:15mm}@media print{body{background:#fff;padding:0;font-size:11px}.pod{max-width:none;border:0;border-radius:0;padding:0}.print-toolbar{display:none}.header{padding-bottom:15px;margin-bottom:16px}.row{grid-template-columns:145px 1fr;padding:8px 0}.photo{height:260px}.confirmation{margin-top:16px}.footer{flex-direction:row;margin-top:20px}}
</style>
</head>

<body>
<div class="print-toolbar"><span>Your delivery record, ready to save or print.</span><button type="button" onclick="window.print()">Save as PDF / Print</button></div>
<div class="pod">

<div class="header">
<p class="company">Richmond Express Couriers</p>
<div class="subtitle">PROOF OF DELIVERY</div>
</div>

<div class="reference">
<strong>Tracking Number:</strong>
${escapeHtml(delivery.tracking_number || "")}
</div>

<div class="row">
<span class="label">Delivery Status</span>
<span class="status">${escapeHtml(delivery.status || "")}</span>
</div>

<div class="row">
<span class="label">Collection</span>
<span>${escapeHtml(delivery.collection_address || "Not recorded")}</span>
</div>

<div class="row">
<span class="label">Destination</span>
<span>${escapeHtml(delivery.delivery_address || "Not recorded")}</span>
</div>

<div class="row">
<span class="label">Original estimate</span>
<span>${estimatedTime}</span>
</div>

<div class="row">
<span class="label">Delivered at</span>
<span>${deliveredTime}</span>
</div>

<div class="row">
<span class="label">Received by</span>
<span>${escapeHtml(delivery.received_by || "Not recorded")}</span>
</div>

${
delivery.pod_photo
? `
<div class="photo-section">
<h2>Photographic Proof of Delivery</h2>

<img
class="photo"
src="${escapeHtml(delivery.pod_photo)}"
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
<main className="tracking-app">
<style>{"\nbody{margin:0;background:#09090d} .tracking-app{min-height:100svh;background:radial-gradient(ellipse at top,#27111b,transparent 650px),#09090d;color:#f8f8fb;font:16px/1.6 Arial,Helvetica,sans-serif;padding:28px 24px 64px}.tracking-app *{box-sizing:border-box}.tracking-shell{max-width:940px;margin:auto}.brand-bar{display:flex;justify-content:space-between;align-items:center;gap:24px;border-bottom:1px solid #2c2931;padding-bottom:24px;margin-bottom:38px}.brand-bar img{width:140px;max-width:100%;height:auto;display:block;border-radius:50%}.back-link{font-size:13px;color:#b8b6c3;text-decoration:none}.eyebrow{font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#ef718e;margin:0 0 10px}.intro h1{font-size:clamp(32px,5vw,46px);line-height:1.1;letter-spacing:-1.6px;margin:0 0 14px}.intro h1 span{color:#ef315c}.intro p:last-child{color:#aaa9b7;margin:0 0 26px;max-width:570px}.search-panel{padding:24px;background:#18181f;border:1px solid #34303b;border-radius:16px;margin-bottom:30px}.search-panel label{display:block;font-size:13px;font-weight:700;margin-bottom:10px}.search-row{display:flex;gap:12px}.search-row input{flex:1;min-width:0;width:100%;background:#0c0c12;color:#fff;border:1px solid #494451;border-radius:9px;padding:14px 16px;font:16px Arial;min-height:50px}.search-row input::placeholder{color:#898594}.tracking-app button,.photo-link{font:700 14px/1.4 Arial;cursor:pointer;border-radius:9px;padding:14px 22px;min-height:48px;border:1px solid #ec466c;background:#d71643;color:#fff;text-decoration:none;display:inline-flex;justify-content:center;align-items:center;gap:9px}.tracking-app button:hover:not(:disabled){background:#ee2453}.tracking-app button:disabled{opacity:.6;cursor:wait}.tracking-app :is(a,button,input):focus-visible{outline:3px solid #ff9cb3;outline-offset:4px}.search-hint{font-size:12px;color:#928e9e;margin:10px 0 0}.error-message{border:1px solid #924357;background:#331822;border-radius:12px;padding:16px 20px;margin-bottom:24px}.delivery-result{scroll-margin-top:24px}.result-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:24px}.result-header h2{font-size:30px;line-height:1.1;letter-spacing:-.8px;margin:0}.status-badge{border:1px solid #8b4358;background:#351b28;color:#ffa5bc;padding:7px 13px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap}.status-badge.delivered{background:#112b24;color:#8fe0be;border-color:#285c4a}.summary{margin:0 0 25px;padding:20px 22px;border:1px solid #33313c;background:#17171f;border-radius:14px}.summary strong{display:block;font-size:21px;letter-spacing:-.5px;color:#fff}.summary span{display:block;font-size:14px;color:#aaa7b6;margin-top:4px}.timeline{list-style:none;padding:0;margin:0 0 30px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0}.timeline li{position:relative;text-align:center;min-width:0;padding:0 3px;font-size:12px;color:#8c8899}.timeline li:before{content:'';position:absolute;height:2px;top:16px;left:0;right:0;background:#34313e}.timeline li:first-child:before{left:50%}.timeline li:last-child:before{right:50%}.timeline li.complete:before{background:#bf2a4c}.step-dot{position:relative;display:flex;align-items:center;justify-content:center;width:34px;height:34px;margin:0 auto 9px;border:1px solid #45414e;background:#1b1923;border-radius:50%;font-weight:700;color:#aaa5b7}.complete .step-dot{background:#d71643;border-color:#d71643;color:white}.timeline li.current .step-dot{box-shadow:0 0 0 4px #d7164326}.timeline .complete{color:#eeecf4}.detail-grid{display:grid;grid-template-columns:1.15fr 1fr;gap:18px}.detail-card{background:#17171e;border:1px solid #302d38;border-radius:16px;padding:24px;min-width:0}.detail-card h3{font-size:17px;margin:0 0 20px;letter-spacing:-.3px}.route-list,.detail-list{margin:0}.route-list>div{position:relative;padding-left:24px}.route-list>div:before{content:'';position:absolute;left:0;top:7px;width:8px;height:8px;border:2px solid #ed4269;border-radius:50%}.route-list>div+div{margin-top:24px}.route-list>div:first-child:after{content:'';position:absolute;top:24px;bottom:-19px;left:5px;width:1px;background:#44404d}.tracking-app dt{font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:#9691a3;margin:0 0 6px}.tracking-app dd{margin:0;color:#f0edf7;font-size:15px;line-height:1.55;overflow-wrap:anywhere;white-space:pre-wrap}.detail-list>div+div{border-top:1px solid #302d38;padding-top:14px;margin-top:14px}.proof-card{margin-top:18px;display:grid;grid-template-columns:180px 1fr;align-items:center;gap:26px}.proof-image{display:block;width:100%;height:220px;object-fit:contain;background:#0b0b10;border:1px solid #34303c;border-radius:10px}.proof-card h3{margin-bottom:8px}.proof-copy p{font-size:14px;color:#a9a4b5;margin:0 0 18px}.proof-copy .photo-link{background:transparent;border-color:#47414f;color:#ece8f4;font-weight:500;min-height:42px;padding:10px 15px}.proof-actions{display:flex;flex-wrap:wrap;gap:10px}.proof-actions button{width:auto}.download-note{font-size:12px!important;color:#928b9f!important;margin:12px 0 0!important}.help-footer{margin-top:32px;border-top:1px solid #2e2835;padding-top:22px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:13px;color:#9f98ab}.help-footer p{margin:0}.help-footer a{color:#e9e2f2;text-underline-offset:4px}.help-links{display:flex;gap:20px}.empty-proof{grid-template-columns:1fr}.tracking-app .subtle{color:#a9a4b5;font-size:14px}\n@media(max-width:600px){.tracking-app{padding:20px 18px 38px}.brand-bar{align-items:flex-start;flex-direction:column;gap:16px;margin-bottom:28px;padding-bottom:20px}.brand-bar img{width:100px}.back-link{order:-1}.intro p:last-child{font-size:14px}.search-panel{padding:18px;margin-bottom:26px}.search-row{flex-direction:column;gap:10px}.search-row button{width:100%}.result-header h2{font-size:27px}.detail-grid{grid-template-columns:1fr;gap:14px}.detail-card{padding:20px}.summary{padding:18px}.summary strong{font-size:20px}.timeline{margin-bottom:26px}.timeline li{font-size:11px}.proof-card{grid-template-columns:1fr;gap:18px}.proof-image{height:230px}.proof-actions{flex-direction:column}.proof-actions>*{width:100%!important}.help-footer{display:block}.help-links{margin-top:10px}.result-header{align-items:center}.eyebrow{font-size:10px}.empty-proof{gap:0}}\n"}</style>
<style>{".search-hint a,.error-message a{color:#f1b4c3;text-underline-offset:3px}.error-message p{margin:0}.error-message p+p{margin-top:10px}.arrival-card{border:1px solid #9f3852;border-left:4px solid #ef315c;background:#25151f;border-radius:12px;padding:20px 22px;margin:0 0 28px}.arrival-card h3{font-size:24px;line-height:1.3;margin:0 0 8px}.arrival-card>p:last-child{margin:0;color:#c3b6c3;font-size:14px}"}</style>
<div className="tracking-shell">
<header className="brand-bar"><a href="https://www.richmondexpresscouriers.co.uk/" aria-label="Richmond Express Couriers home"><img src="https://static1.squarespace.com/static/6a7c5fbc239cd3610d31d9dd/t/6abac2402aed9b11130ef609/1790624320552/logo.jpeg" alt="Richmond Express Couriers" /></a><a className="back-link" href="https://www.richmondexpresscouriers.co.uk/">← Back to our website</a></header>
<section className="intro" aria-labelledby="tracking-title"><p className="eyebrow">Your delivery. Our priority.</p><h1 id="tracking-title">Track your delivery<span>.</span></h1><p>From collection to completion. Enter your reference for the latest update and proof of delivery.</p></section>
<form className="search-panel" onSubmit={trackDelivery}><label htmlFor="tracking-number">Tracking number</label><div className="search-row"><input id="tracking-number" aria-label="Tracking number" aria-describedby="tracking-hint" aria-invalid={Boolean(error)} autoCapitalize="characters" spellCheck={false} type="text" placeholder="e.g. REC-1010" value={trackingNumber} onChange={e=>{setTrackingNumber(e.target.value);setError("");}} /><button type="submit" disabled={loading}>{loading ? "Finding delivery…" : "Track delivery"}</button></div><p className="search-hint" id="tracking-hint">Look for a reference such as REC-1010 in your delivery confirmation. Enter the full reference, including REC-. Can’t find it? <a href="tel:07368922515">Call us</a> or <a href="https://wa.me/447368922515">WhatsApp us</a>.</p></form>
{error && <div className="error-message" role="alert"><p>{error}</p><p>Need help? <a href="tel:07368922515">Call 07368 922515</a> or <a href="https://wa.me/447368922515">WhatsApp us</a> with your reference.</p></div>}
<div aria-live="polite" aria-busy={loading}>
{delivery && <section className="delivery-result" aria-labelledby="delivery-reference">
<header className="result-header"><div><p className="eyebrow">Delivery overview</p><h2 id="delivery-reference">{delivery.tracking_number}</h2></div><span className={"status-badge"+(delivery.status === "Delivered" ? " delivered" : "")}>{delivery.status === "Delivered" ? "✓ Delivered" : delivery.status || "Awaiting update"}</span></header>
<div className="summary"><strong>{delivery.status === "Delivered" ? "Your delivery is complete." : delivery.status === "In Transit" ? "Your delivery is on the road." : delivery.status === "Collected" ? "Your goods have been collected." : delivery.status === "Booked" ? "Your delivery is booked." : "Your latest delivery update."}</strong><span>{delivery.status === "Delivered" ? (delivery.delivered_at ? "Delivered " + formatDate(delivery.delivered_at) : "Delivery confirmed") : "Check your delivery progress below."}</span></div>
{delivery.status !== "Delivered" && <section className="arrival-card" aria-label="Delivery estimate"><p className="eyebrow">{estimatedDelivery ? (estimatePassed ? "Last delivery estimate" : "Estimated delivery") : "Delivery estimate"}</p><h3>{estimatedDelivery ? formatDate(estimatedDelivery) : "Time to be confirmed"}</h3><p>{estimatedDelivery ? (estimatePassed ? "This estimated time has passed. We’re awaiting a further update; please contact us if you need the latest arrival information." : "UK time. This is an estimate and may change as your delivery progresses.") : "An estimated arrival time hasn’t been added yet. Check back here, or contact us for an update."}</p></section>}
<ol className="timeline" aria-label="Delivery progress">{stages.map((stage,index)=><li key={stage} className={(index<=currentStageIndex ? "complete " : "")+(index===currentStageIndex ? "current" : "")} aria-current={index===currentStageIndex ? "step" : undefined}><span className="step-dot" aria-hidden="true">{index<=currentStageIndex ? "✓" : index+1}</span><span>{stage}</span></li>)}</ol>
<div className="detail-grid"><section className="detail-card"><h3>Delivery route</h3><dl className="route-list"><div><dt>Collection</dt><dd>{delivery.collection_address || "Not recorded"}</dd></div><div><dt>Destination</dt><dd>{delivery.delivery_address || "Not recorded"}</dd></div></dl></section><section className="detail-card"><h3>Delivery details</h3><dl className="detail-list">{delivery.status === "Delivered" && <div><dt>Delivered at</dt><dd>{delivery.delivered_at ? formatDate(delivery.delivered_at) : "Not recorded"}</dd></div>}{delivery.received_by && <div><dt>Received by</dt><dd>{delivery.received_by}</dd></div>}<div><dt>{delivery.status === "Delivered" ? "Original estimate" : "Estimated delivery"}</dt><dd>{delivery.estimated_delivery ? formatDate(delivery.estimated_delivery) : "To be confirmed"}</dd></div></dl></section></div>
{(delivery.pod_photo || delivery.status === "Delivered") && <section className={"detail-card proof-card"+(!delivery.pod_photo ? " empty-proof" : "")}>{delivery.pod_photo && <a href={delivery.pod_photo} target="_blank" rel="noopener noreferrer" aria-label="Open full-size proof of delivery photo"><img className="proof-image" src={delivery.pod_photo} alt="Photographic proof of delivery" /></a>}<div className="proof-copy"><p className="eyebrow">Delivery confirmation</p><h3>Proof of delivery</h3><p>{delivery.pod_photo ? "View the original photograph or save a copy of your delivery record." : "Save a copy of your delivery record. No photograph has been added."}</p><div className="proof-actions">{delivery.status === "Delivered" && <button type="button" onClick={downloadPOD}>Print / save as PDF</button>}{delivery.pod_photo && <a className="photo-link" href={delivery.pod_photo} target="_blank" rel="noopener noreferrer">View full photo ↗</a>}</div>{delivery.status === "Delivered" && <p className="download-note">Opens your delivery record in a new tab. Choose “Save as PDF” in the print options to keep a copy. If it doesn’t open, allow pop-ups for this site.</p>}</div></section>}
</section>}
</div><footer className="help-footer"><p>Need a hand with your delivery?</p><div className="help-links"><a href="tel:07368922515">Call 07368 922515</a><a href="https://wa.me/447368922515">WhatsApp us</a></div></footer>
</div></main>
);
}
