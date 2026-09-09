use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminPage() {
const [deliveries, setDeliveries] = useState([]);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

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

loadDeliveries();
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
const { data } = await supabase
.from("Deliveries")
.select("tracking_number")
.order("id", { ascending: false })
.limit(1);

if (!data || data.length === 0) {
return "REC-1001";
}

const last = data[0]?.tracking_number || "REC-1000";
const number = parseInt(last.replace("REC-", ""), 10);

if (Number.isNaN(number)) {
return "REC-1001";
}

return `REC-${String(number + 1).padStart(4, "0")}`;
}

async function addDelivery(e) {
e.preventDefault();

setLoading(true);
setMessage("");

const trackingNumber = await getNextTrackingNumber();

const { error } = await supabase.from("Deliveries").insert([
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

setCustomerName("");
setCustomerPhone("");
setCustomerEmail("");
setDeliveryNotes("");
setCollectionAddress("");
setDeliveryAddress("");
setEstimatedDelivery("");

setMessage(`Delivery created successfully — ${trackingNumber}`);
await loadDeliveries();
setLoading(false);
}

function selectDelivery(delivery) {
setSelectedTracking(delivery.tracking_number);
setStatus(delivery.status || "Booked");
setReceivedBy(delivery.received_by || "");
setExistingPod(delivery.pod_photo || "");
setPodFile(null);

setTimeout(() => {
document
.getElementById("update-delivery")
?.scrollIntoView({ behavior: "smooth" });
}, 100);
}

async function updateDelivery(e) {
e.preventDefault();

if (!selectedTracking) {
setMessage("Select a delivery first.");
return;
}

setLoading(true);
setMessage("");

const updates = {
status,
};

if (status === "Delivered") {
if (!receivedBy.trim()) {
setMessage("Please enter who received the delivery.");
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
setMessage("You need to be logged in to upload a POD photo.");
setLoading(false);
return;
}

const extension =
podFile.name?.split(".").pop()?.toLowerCase() || "jpg";

const filePath = `${user.id}/${selectedTracking}-${Date.now()}.${extension}`;

const { error: uploadError } = await supabase.storage
.from("pod-photos")
.upload(filePath, podFile);

if (uploadError) {
setMessage("Photo upload failed: " + uploadError.message);
setLoading(false);
return;
}

const { data: publicData } = supabase.storage
.from("pod-photos")
.getPublicUrl(filePath);

updates.pod_photo = publicData.publicUrl;
}
}

const { error } = await supabase
.from("Deliveries")
.update(updates)
.eq("tracking_number", selectedTracking);

if (error) {
setMessage("Could not update delivery: " + error.message);
setLoading(false);
return;
}

setMessage(`${selectedTracking} updated successfully.`);
await loadDeliveries();
setLoading(false);
}

async function signOut() {
await supabase.auth.signOut();
window.location.href = "/login";
}

const inputStyle = {
width: "100%",
boxSizing: "border-box",
padding: "12px",
marginBottom: "12px",
fontSize: "16px",
borderRadius: "6px",
border: "1px solid #ccc",
};

const buttonStyle = {
width: "100%",
padding: "14px",
border: "none",
borderRadius: "6px",
backgroundColor: "#e53935",
color: "#fff",
fontWeight: "bold",
fontSize: "16px",
cursor: "pointer",
};

return (
<main
style={{
minHeight: "100vh",
background: "#1f1f1f",
color: "#fff",
padding: "20px",
fontFamily: "Arial, sans-serif",
}}
>
<div style={{ maxWidth: "800px", margin: "0 auto" }}>
<h1 style={{ marginBottom: "5px" }}>
Richmond Express Couriers
</h1>

<h2 style={{ marginTop: "0", marginBottom: "20px" }}>
Admin Dashboard
</h2>

<button
onClick={signOut}
style={{
marginBottom: "25px",
padding: "10px 18px",
border: "1px solid #fff",
background: "transparent",
color: "#fff",
borderRadius: "6px",
cursor: "pointer",
}}
>
Sign Out
</button>

{message && (
<div
style={{
padding: "12px",
marginBottom: "20px",
background: "#333",
borderRadius: "6px",
}}
>
{message}
</div>
)}

<section
style={{
background: "#2b2b2b",
padding: "20px",
borderRadius: "10px",
marginBottom: "30px",
}}
>
<h2>Add Delivery</h2>

<form onSubmit={addDelivery}>
<input
style={inputStyle}
placeholder="Customer name"
value={customerName}
onChange={(e) => setCustomerName(e.target.value)}
/>

<input
style={inputStyle}
placeholder="Customer phone"
value={customerPhone}
onChange={(e) => setCustomerPhone(e.target.value)}
/>

<input
style={inputStyle}
type="email"
placeholder="Customer email"
value={customerEmail}
onChange={(e) => setCustomerEmail(e.target.value)}
/>

<textarea
style={inputStyle}
placeholder="Delivery notes"
value={deliveryNotes}
onChange={(e) => setDeliveryNotes(e.target.value)}
/>

<textarea
style={inputStyle}
placeholder="Collection address"
required
value={collectionAddress}
onChange={(e) => setCollectionAddress(e.target.value)}
/>

<textarea
style={inputStyle}
placeholder="Delivery address"
required
value={deliveryAddress}
onChange={(e) => setDeliveryAddress(e.target.value)}
/>

<label style={{ display: "block", marginBottom: "6px" }}>
Estimated delivery
</label>

<input
style={inputStyle}
type="datetime-local"
value={estimatedDelivery}
onChange={(e) => setEstimatedDelivery(e.target.value)}
/>

<button style={buttonStyle} type="submit" disabled={loading}>
{loading ? "Saving..." : "Create Delivery"}
</button>
</form>
</section>

<section
id="update-delivery"
style={{
background: "#2b2b2b",
padding: "20px",
borderRadius: "10px",
marginBottom: "30px",
}}
>
<h2>Update Delivery</h2>

{!selectedTracking ? (
<p>Select a delivery from the list below.</p>
) : (
<form onSubmit={updateDelivery}>
<p>
<strong>Tracking:</strong> {selectedTracking}
</p>

<label style={{ display: "block", marginBottom: "6px" }}>
Status
</label>

<select
style={inputStyle}
value={status}
onChange={(e) => setStatus(e.target.value)}
>
<option>Booked</option>
<option>Collected</option>
<option>In Transit</option>
<option>Delivered</option>
</select>

{status === "Delivered" && (
<>
<input
style={inputStyle}
placeholder="Received by"
value={receivedBy}
onChange={(e) => setReceivedBy(e.target.value)}
/>

<label style={{ display: "block", marginBottom: "8px" }}>
Proof of delivery photo
</label>

<input
style={inputStyle}
type="file"
accept="image/*"
capture="environment"
onChange={(e) =>
setPodFile(e.target.files?.[0] || null)
}
/>

{existingPod && (
<div style={{ marginBottom: "15px" }}>
<p>Existing POD:</p>
<img
src={existingPod}
alt="Proof of delivery"
style={{
maxWidth: "100%",
maxHeight: "300px",
borderRadius: "8px",
}}
/>
</div>
)}
</>
)}

<button style={buttonStyle} type="submit" disabled={loading}>
{loading ? "Updating..." : "Update Delivery"}
</button>
</form>
)}
</section>

<section>
<h2>Current Deliveries</h2>

{deliveries.length === 0 ? (
<p>No deliveries found.</p>
) : (
deliveries.map((delivery) => (
<div
key={delivery.id || delivery.tracking_number}
style={{
background: "#2b2b2b",
padding: "18px",
marginBottom: "14px",
borderRadius: "10px",
}}
>
<h3 style={{ marginTop: "0" }}>
{delivery.tracking_number}
</h3>

<p>
<strong>Status:</strong> {delivery.status}
</p>

{delivery.customer_name && (
<p>
<strong>Customer:</strong> {delivery.customer_name}
</p>
)}

<p>
<strong>Collection:</strong>{" "}
{delivery.collection_address}
</p>

<p>
<strong>Delivery:</strong>{" "}
{delivery.delivery_address}
</p>

{delivery.received_by && (
<p>
<strong>Received by:</strong>{" "}
{delivery.received_by}
</p>
)}

<button
onClick={() => selectDelivery(delivery)}
style={{
padding: "10px 15px",
border: "none",
borderRadius: "6px",
background: "#e53935",
color: "#fff",
fontWeight: "bold",
cursor: "pointer",
}}
>
Select Delivery
</button>
</div>
))
)}
</section>
</div>
</main>
);
}
