"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminPage() {
const [deliveries, setDeliveries] = useState([]);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [createdTracking, setCreatedTracking] = useState("");
const [copyFallback, setCopyFallback] = useState("");

const [customerName, setCustomerName] = useState("");
const [customerPhone, setCustomerPhone] = useState("");
const [customerEmail, setCustomerEmail] = useState("");
const [deliveryNotes, setDeliveryNotes] = useState("");
const [collectionAddress, setCollectionAddress] = useState("");
const [deliveryAddress, setDeliveryAddress] = useState("");
const [estimatedDelivery, setEstimatedDelivery] = useState("");

const [selectedTracking, setSelectedTracking] = useState("");
const [status, setStatus] = useState("Booked");
const [receivedBy, setReceivedBy] = useState("");
const [podFile, setPodFile] = useState(null);
const [existingPod, setExistingPod] = useState("");

useEffect(() => {
checkLogin();
}, []);

async function checkLogin() {
const {
data: { session },
} = await supabase.auth.getSession();

if (!session) {
window.location.href = "/login";
return;
}

await loadDeliveries();
}

async function loadDeliveries() {
const { data, error } = await supabase
.from("Deliveries")
.select("*")
.order("id", { ascending: false });

if (error) {
setMessage("Could not load deliveries: " + error.message);
return;
}

setDeliveries(data || []);
}

async function getNextTrackingNumber() {
const { data, error } = await supabase
.from("Deliveries")
.select("tracking_number")
.order("id", { ascending: false })
.limit(1);

if (error || !data || data.length === 0) {
return "REC-1001";
}

const lastTracking = data[0]?.tracking_number || "REC-1000";
const lastNumber = parseInt(
lastTracking.replace("REC-", ""),
10
);

if (Number.isNaN(lastNumber)) {
return "REC-1001";
}

return `REC-${String(lastNumber + 1).padStart(4, "0")}`;
}

function trackingLink(reference) {
return "https://track.richmondexpresscouriers.co.uk/?ref=" + encodeURIComponent(reference);
}

async function copyTracking(reference, includeMessage = false) {
const link = trackingLink(reference);
const text = includeMessage
? "Richmond Express Couriers\nYour delivery reference: " + reference + "\nTrack your delivery and view the latest updates here:\n" + link + "\nNeed help? Call 07368 922515."
: link;
setCopyFallback("");
try {
await navigator.clipboard.writeText(text);
setMessage((includeMessage ? "Customer message" : "Tracking link") + " copied for " + reference + ". Paste it into your email or WhatsApp message.");
} catch {
setCopyFallback(text);
setMessage("Automatic copying is unavailable. Select and copy the text below.");
}
}

async function addDelivery(e) {
e.preventDefault();

setLoading(true);
setMessage("");

const trackingNumber = await getNextTrackingNumber();

const { error } = await supabase
.from("Deliveries")
.insert([
{
tracking_number: trackingNumber,
customer_name: customerName.trim() || null,
customer_phone: customerPhone.trim() || null,
customer_email: customerEmail.trim() || null,
delivery_notes: deliveryNotes.trim() || null,
collection_address: collectionAddress.trim(),
delivery_address: deliveryAddress.trim(),
estimated_delivery: estimatedDelivery || null,
status: "Booked",
},
]);

if (error) {
setMessage("Could not add delivery: " + error.message);
setLoading(false);
return;
}

setCreatedTracking(trackingNumber);
setCustomerName("");
setCustomerPhone("");
setCustomerEmail("");
setDeliveryNotes("");
setCollectionAddress("");
setDeliveryAddress("");
setEstimatedDelivery("");

setMessage(
`Delivery created successfully — ${trackingNumber}`
);

await loadDeliveries();
setLoading(false);
}

function selectDelivery(delivery) {
setSelectedTracking(delivery.tracking_number);
setActivePanel("update");
setMessage("");
setStatus(delivery.status || "Booked");
setReceivedBy(delivery.received_by || "");
setExistingPod(delivery.pod_photo || "");
setPodFile(null);

setTimeout(() => {
document
.getElementById("update-delivery")
?.scrollIntoView({
behavior: "smooth",
block: "start",
});
}, 100);
}

async function updateDelivery(e) {
e.preventDefault();

if (!selectedTracking) {
setMessage("Please select a delivery first.");
return;
}

setLoading(true);
setMessage("");

const updates = {
status,
};

if (status === "Delivered") {
if (!receivedBy.trim()) {
setMessage(
"Please enter the name of the person who received the delivery."
);
setLoading(false);
return;
}

updates.received_by = receivedBy.trim();
updates.delivered_at = new Date().toISOString();

if (podFile) {
const {
data: { user },
error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
setMessage(
"You need to be logged in to upload a POD photo."
);
setLoading(false);
return;
}

const extension =
podFile.name
?.split(".")
.pop()
?.toLowerCase() || "jpg";

const filePath =
`${user.id}/${selectedTracking}-${Date.now()}.${extension}`;

const { error: uploadError } =
await supabase.storage
.from("pod-photos")
.upload(filePath, podFile, {
upsert: false,
});

if (uploadError) {
setMessage(
"POD photo upload failed: " +
uploadError.message
);
setLoading(false);
return;
}

const { data: publicUrlData } =
supabase.storage
.from("pod-photos")
.getPublicUrl(filePath);

updates.pod_photo =
publicUrlData.publicUrl;
}
}

const { error } = await supabase
.from("Deliveries")
.update(updates)
.eq("tracking_number", selectedTracking);

if (error) {
setMessage(
"Could not update delivery: " + error.message
);
setLoading(false);
return;
}

setMessage(
`${selectedTracking} updated successfully.`
);

await loadDeliveries();
setLoading(false);
}

async function signOut() {
await supabase.auth.signOut();
window.location.href = "/login";
}

const [activePanel, setActivePanel] = useState("deliveries");
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const statuses = ["Booked", "Collected", "In Transit", "Delivered"];
const visibleDeliveries = deliveries.filter((delivery) => {
const matchesStatus = statusFilter === "All" || (statusFilter === "Active" ? delivery.status !== "Delivered" : delivery.status === statusFilter);
const query = search.trim().toLowerCase();
return matchesStatus && [delivery.tracking_number, delivery.customer_name, delivery.customer_phone, delivery.customer_email, delivery.collection_address, delivery.delivery_address].some(value => String(value || "").toLowerCase().includes(query));
});
const selectedDelivery = deliveries.find(delivery => delivery.tracking_number === selectedTracking);
return (
<main className="rec-admin">
<style>{".rec-admin{min-height:100vh;background:#0d0e12;color:#f5f5f7;font-family:Arial,sans-serif;padding:28px 22px 64px;box-sizing:border-box}.rec-admin *{box-sizing:border-box}.rec-admin .shell{max-width:1120px;margin:auto}.rec-admin .topbar{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:30px}.rec-admin .eyebrow{font-size:11px;letter-spacing:2px;color:#f04a6b;text-transform:uppercase;font-weight:700;margin:0 0 10px}.rec-admin h1{font-size:32px;letter-spacing:-1px;margin:0 0 9px}.rec-admin h2{font-size:22px;margin:0 0 8px}.rec-admin h3{margin:0;font-size:18px}.rec-admin .muted{color:#a5a7b5;font-size:14px;line-height:1.6;margin:0}.rec-admin button,.rec-admin .link-button{font:inherit;cursor:pointer;border:1px solid #393b49;border-radius:9px;padding:12px 17px;background:#232530;color:#fff;line-height:1.2;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px}.rec-admin button:hover:not(:disabled){background:#303340}.rec-admin button:disabled{opacity:.5;cursor:wait}.rec-admin .primary{background:#d9143f;border-color:#d9143f;font-weight:bold}.rec-admin .primary:hover:not(:disabled){background:#ed204d}.rec-admin .quiet{background:transparent;color:#bfc0ca}.rec-admin .actions{display:flex;gap:10px;flex-wrap:wrap}.rec-admin .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:26px}.rec-admin .stat{border:1px solid #2d303c;background:#181a22;border-radius:13px;padding:18px}.rec-admin .stat span{display:block;font-size:12px;color:#aeb0bf;margin-bottom:10px}.rec-admin .stat strong{font-size:29px}.rec-admin .tabs{display:flex;gap:6px;border-bottom:1px solid #30323e;margin-bottom:25px;padding-bottom:12px;flex-wrap:wrap}.rec-admin .tabs button{border:0;background:transparent;color:#aeb0bf}.rec-admin .tabs button[aria-pressed=true]{background:#3d1724;color:#ff91a9}.rec-admin .panel{background:#181a22;border:1px solid #2d303c;border-radius:16px;padding:26px}.rec-admin .section-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:23px}.rec-admin .fields{display:grid;grid-template-columns:1fr 1fr;gap:19px}.rec-admin label{display:flex;flex-direction:column;gap:9px;font-size:13px;font-weight:600}.rec-admin label small{font-weight:normal;color:#999dab}.rec-admin input,.rec-admin textarea,.rec-admin select{width:100%;min-width:0;border:1px solid #444754;background:#101219;color:#f5f5f7;border-radius:9px;padding:13px;font:16px Arial,sans-serif;color-scheme:dark}.rec-admin textarea{min-height:95px;resize:vertical;line-height:1.5}.rec-admin input::placeholder,.rec-admin textarea::placeholder{color:#828694}.rec-admin input:focus,.rec-admin textarea:focus,.rec-admin select:focus{outline:2px solid #f25b7b;outline-offset:2px}.rec-admin button:focus-visible,.rec-admin a:focus-visible{outline:2px solid #f25b7b;outline-offset:3px}.rec-admin .wide{grid-column:1/-1}.rec-admin .form-foot{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:24px}.rec-admin .notice{padding:15px 18px;border:1px solid #695069;background:#2b2030;border-radius:10px;margin-bottom:22px;line-height:1.5;overflow-wrap:anywhere}.rec-admin .filters{display:grid;grid-template-columns:1fr 210px;gap:14px;margin-bottom:24px}.rec-admin .jobs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.rec-admin .job{background:#181a22;border:1px solid #2d303c;border-radius:14px;padding:22px;overflow-wrap:anywhere}.rec-admin .job.selected{border-color:#e43a61}.rec-admin .job-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:18px}.rec-admin .badge{display:inline-block;font-size:11px;font-weight:bold;padding:7px 9px;border-radius:20px;background:#303443;color:#d5d7e1}.rec-admin .badge[data-status=Collected]{background:#40351e;color:#ffdb86}.rec-admin .badge[data-status='In Transit']{background:#1d324c;color:#94c7ff}.rec-admin .badge[data-status=Delivered]{background:#173b2c;color:#86e1ae}.rec-admin .route{display:grid;gap:13px;margin:16px 0 20px;padding:16px 0;border-top:1px solid #30323e;border-bottom:1px solid #30323e}.rec-admin .route dt{color:#9398aa;text-transform:uppercase;letter-spacing:1px;font-size:10px;margin-bottom:5px}.rec-admin .route dd{margin:0;font-size:14px;line-height:1.5;white-space:pre-wrap}.rec-admin .job .actions{margin-top:18px}.rec-admin .job p{line-height:1.55}.rec-admin .empty{text-align:center;padding:44px 20px;border:1px dashed #3b3e4d;border-radius:14px}.rec-admin .empty h3{margin-bottom:10px}.rec-admin .empty button{margin-top:20px}.rec-admin .update{max-width:760px;margin:auto;scroll-margin-top:20px}.rec-admin .proof{max-width:100%;max-height:300px;object-fit:contain;border-radius:10px;margin-top:10px}.rec-admin .hint{font-size:12px;color:#a5a7b5;line-height:1.5}.rec-admin a{color:#e8e9ef;text-underline-offset:3px}@media(max-width:700px){.rec-admin{padding:22px 16px 40px}.rec-admin .topbar{align-items:flex-start;flex-direction:column}.rec-admin h1{font-size:28px}.rec-admin .stats{grid-template-columns:1fr 1fr}.rec-admin .fields,.rec-admin .jobs,.rec-admin .filters{grid-template-columns:1fr}.rec-admin .panel,.rec-admin .job{padding:20px}.rec-admin .section-head,.rec-admin .form-foot{align-items:stretch;flex-direction:column}.rec-admin .form-foot button{width:100%}.rec-admin .stat{padding:16px}}"}</style>
<div className="shell">
<header className="topbar">
<div><p className="eyebrow">Richmond Express Couriers</p><h1>Delivery dashboard</h1><p className="muted">Your jobs, from collection to completion.</p></div>
<div className="actions"><a className="link-button quiet" href="/" target="_blank" rel="noreferrer">View tracking page</a><button className="quiet" type="button" onClick={signOut}>Sign out</button></div>
</header>
<div className="stats" aria-label="Delivery totals">
{[{label:"Total deliveries", count:deliveries.length},{label:"Awaiting collection",count:deliveries.filter(d=>d.status === "Booked").length},{label:"On the road",count:deliveries.filter(d=>["Collected","In Transit"].includes(d.status)).length},{label:"Delivered",count:deliveries.filter(d=>d.status === "Delivered").length}].map(item=><div className="stat" key={item.label}><span>{item.label}</span><strong>{item.count}</strong></div>)}
</div>
<nav className="tabs" aria-label="Dashboard sections">
<button type="button" aria-pressed={activePanel === "deliveries"} onClick={()=>setActivePanel("deliveries")}>Deliveries</button>
<button type="button" aria-pressed={activePanel === "add"} onClick={()=>setActivePanel("add")}>+ New delivery</button>
<button type="button" aria-pressed={activePanel === "update"} onClick={()=>setActivePanel("update")}>Update delivery</button>
</nav>
{message && <div className="notice" role="status" aria-live="polite">{message}</div>}
{copyFallback && <label style={{marginBottom:22}}>Copy this text<textarea readOnly value={copyFallback} onFocus={e=>e.target.select()} /></label>}
{createdTracking && <section className="notice" aria-label="New delivery tracking link"><h3>{createdTracking} — ready to share</h3><p className="hint">Copy the link or customer message into your booking confirmation. The link opens this delivery automatically.</p><div className="actions"><button type="button" onClick={()=>copyTracking(createdTracking)}>Copy tracking link</button><button type="button" onClick={()=>copyTracking(createdTracking,true)}>Copy customer message</button><a className="link-button quiet" href={trackingLink(createdTracking)} target="_blank" rel="noopener noreferrer">Open customer tracking</a><button type="button" className="quiet" onClick={()=>setCreatedTracking("")}>Dismiss</button></div></section>}
<section hidden={activePanel !== "add"} className="panel">
<div className="section-head"><div><h2>New delivery</h2><p className="muted">Add the job details. A tracking number is created automatically.</p></div></div>
<form onSubmit={addDelivery}>
<div className="fields">
<label>Customer name <input type="text" autoComplete="name" placeholder="Name or business" value={customerName} onChange={e=>setCustomerName(e.target.value)} /></label>
<label>Phone number <input type="tel" autoComplete="tel" placeholder="Customer contact number" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} /></label>
<label>Email address <input type="email" autoComplete="email" placeholder="Customer email address" value={customerEmail} onChange={e=>setCustomerEmail(e.target.value)} /></label>
<label>Estimated delivery <input type="datetime-local" value={estimatedDelivery} onChange={e=>setEstimatedDelivery(e.target.value)} /></label>
<label>Collection address <small>Required</small><textarea required placeholder="Address and postcode" value={collectionAddress} onChange={e=>setCollectionAddress(e.target.value)} /></label>
<label>Delivery address <small>Required</small><textarea required placeholder="Address and postcode" value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} /></label>
<label className="wide">Delivery notes <textarea placeholder="Access details, item information or special instructions" value={deliveryNotes} onChange={e=>setDeliveryNotes(e.target.value)} /></label>
</div>
<div className="form-foot"><p className="hint">Only collection and delivery addresses are required.</p><button className="primary" type="submit" disabled={loading}>{loading ? "Saving..." : "Create delivery"}</button></div>
</form>
</section>
<section id="update-delivery" hidden={activePanel !== "update"} className="panel update">
<div className="section-head"><div><h2>Update delivery</h2><p className="muted">Record progress and proof of delivery.</p></div><button type="button" className="quiet" onClick={()=>setActivePanel("deliveries")}>Back to deliveries</button></div>
{!selectedTracking ? <div className="empty"><h3>Choose a delivery first</h3><p className="muted">Find the job in your delivery list, then select Update delivery.</p><button type="button" onClick={()=>setActivePanel("deliveries")}>Find a delivery</button></div> :
<form onSubmit={updateDelivery}>
<div className="job-top"><h3>{selectedTracking}</h3><span className="badge" data-status={selectedDelivery?.status}>{selectedDelivery?.status}</span></div>
{selectedDelivery && <p className="muted" style={{marginBottom:20}}>{selectedDelivery.customer_name || "Customer not specified"}<br />{selectedDelivery.delivery_address}</p>}
<div className="fields">
<label className="wide">Delivery status<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(item=><option key={item} value={item}>{item}</option>)}</select></label>
{status === "Delivered" && <>
<label className="wide">Received by <small>Required to mark the delivery as complete</small><input type="text" required placeholder="Name of the person receiving the delivery" value={receivedBy} onChange={e=>setReceivedBy(e.target.value)} /></label>
<label className="wide">Proof of delivery photo <small>Optional — take a photo or choose an image</small><input type="file" accept="image/*" capture="environment" onChange={e=>setPodFile(e.target.files?.[0] || null)} /></label>
{existingPod && <div className="wide"><p className="muted">Existing proof of delivery</p><img className="proof" src={existingPod} alt="Existing proof of delivery" /></div>}
</>}
</div>
<div className="form-foot"><p className="hint">Saved changes appear on the customer tracking page.</p><button className="primary" type="submit" disabled={loading}>{loading ? "Updating..." : "Save delivery update"}</button></div>
</form>}
</section>
<section hidden={activePanel !== "deliveries"}>
<div className="section-head"><div><h2>Your deliveries</h2><p className="muted">Find a job and keep its progress up to date.</p></div><button type="button" className="primary" onClick={()=>setActivePanel("add")}>+ New delivery</button></div>
<div className="filters"><label>Search deliveries<input type="search" placeholder="Tracking number, customer or address" value={search} onChange={e=>setSearch(e.target.value)} /></label><label>Status<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>{["All","Active",...statuses].map(item=><option key={item} value={item}>{item === "All" ? "All statuses" : item === "Active" ? "Active deliveries" : item}</option>)}</select></label></div>
<p className="hint">{visibleDeliveries.length} of {deliveries.length} deliveries</p>
{visibleDeliveries.length === 0 ? <div className="empty"><h3>{deliveries.length ? "No matching deliveries" : "No deliveries yet"}</h3><p className="muted">{deliveries.length ? "Try another search or choose a different status." : "Create your first delivery to get started."}</p><button type="button" onClick={()=>{if(deliveries.length){setSearch("");setStatusFilter("All");}else{setActivePanel("add");}}}>{deliveries.length ? "Clear filters" : "Create a delivery"}</button></div> :
<div className="jobs">{visibleDeliveries.map(delivery=><article className={"job" + (selectedTracking === delivery.tracking_number ? " selected" : "")} key={delivery.id || delivery.tracking_number}>
<div className="job-top"><h3>{delivery.tracking_number}</h3><span className="badge" data-status={delivery.status}>{delivery.status || "Booked"}</span></div>
<p className="muted">{delivery.customer_name || "Customer not specified"}</p>
<dl className="route"><div><dt>Collection</dt><dd>{delivery.collection_address}</dd></div><div><dt>Delivery</dt><dd>{delivery.delivery_address}</dd></div></dl>
{delivery.estimated_delivery && <p className="hint">Estimated: {new Date(delivery.estimated_delivery).toLocaleString("en-GB")}</p>}
{delivery.customer_phone && <p className="hint">Phone: <a href={"tel:"+delivery.customer_phone}>{delivery.customer_phone}</a></p>}
{delivery.customer_email && <p className="hint">Email: <a href={"mailto:"+delivery.customer_email}>{delivery.customer_email}</a></p>}
{delivery.delivery_notes && <p className="hint">Notes: {delivery.delivery_notes}</p>}
{delivery.received_by && <p className="hint">Received by {delivery.received_by}</p>}
{delivery.pod_photo && <p className="hint">Proof of delivery available</p>}
<div className="actions"><button type="button" className="primary" disabled={loading} onClick={()=>selectDelivery(delivery)}>Update delivery</button><button type="button" onClick={()=>copyTracking(delivery.tracking_number)}>Copy tracking link</button><button type="button" onClick={()=>copyTracking(delivery.tracking_number,true)}>Copy customer message</button><a className="link-button quiet" href={trackingLink(delivery.tracking_number)} target="_blank" rel="noopener noreferrer">Open customer tracking</a></div>
</article>)}</div>}
</section>
</div>
</main>
);
}
