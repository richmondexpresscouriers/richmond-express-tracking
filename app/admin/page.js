"use client";

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

const inputStyle = {
width: "100%",
boxSizing: "border-box",
padding: "13px",
marginBottom: "14px",
fontSize: "16px",
borderRadius: "6px",
border: "1px solid #ccc",
};

const primaryButton = {
width: "100%",
padding: "15px",
border: "none",
borderRadius: "6px",
backgroundColor: "#e53935",
color: "#ffffff",
fontWeight: "bold",
fontSize: "16px",
cursor: "pointer",
};

const sectionStyle = {
backgroundColor: "#2b2b2b",
padding: "20px",
borderRadius: "10px",
marginBottom: "30px",
};

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
maxWidth: "800px",
margin: "0 auto",
}}
>
<h1
style={{
marginBottom: "5px",
}}
>
Richmond Express Couriers
</h1>

<h2
style={{
marginTop: "0",
marginBottom: "20px",
}}
>
Admin Dashboard
</h2>

<button
type="button"
onClick={signOut}
style={{
padding: "10px 18px",
marginBottom: "25px",
border: "1px solid #ffffff",
borderRadius: "6px",
backgroundColor: "transparent",
color: "#ffffff",
cursor: "pointer",
}}
>
Sign Out
</button>

{message && (
<div
style={{
padding: "13px",
marginBottom: "20px",
backgroundColor: "#333333",
borderRadius: "6px",
}}
>
{message}
</div>
)}

<section style={sectionStyle}>
<h2>Add Delivery</h2>

<form onSubmit={addDelivery}>
<input
type="text"
style={inputStyle}
placeholder="Customer name"
value={customerName}
onChange={(e) =>
setCustomerName(e.target.value)
}
/>

<input
type="tel"
style={inputStyle}
placeholder="Customer phone"
value={customerPhone}
onChange={(e) =>
setCustomerPhone(e.target.value)
}
/>

<input
type="email"
style={inputStyle}
placeholder="Customer email"
value={customerEmail}
onChange={(e) =>
setCustomerEmail(e.target.value)
}
/>

<textarea
style={inputStyle}
placeholder="Delivery notes"
value={deliveryNotes}
onChange={(e) =>
setDeliveryNotes(e.target.value)
}
/>

<textarea
style={inputStyle}
placeholder="Collection address"
required
value={collectionAddress}
onChange={(e) =>
setCollectionAddress(e.target.value)
}
/>

<textarea
style={inputStyle}
placeholder="Delivery address"
required
value={deliveryAddress}
onChange={(e) =>
setDeliveryAddress(e.target.value)
}
/>

<label
style={{
display: "block",
marginBottom: "7px",
}}
>
Estimated delivery
</label>

<input
type="datetime-local"
style={inputStyle}
value={estimatedDelivery}
onChange={(e) =>
setEstimatedDelivery(e.target.value)
}
/>

<button
type="submit"
disabled={loading}
style={primaryButton}
>
{loading
? "Saving..."
: "Create Delivery"}
</button>
</form>
</section>

<section
id="update-delivery"
style={sectionStyle}
>
<h2>Update Delivery</h2>

{!selectedTracking ? (
<p>
Select a delivery from the list below.
</p>
) : (
<form onSubmit={updateDelivery}>
<p>
<strong>Tracking number:</strong>{" "}
{selectedTracking}
</p>

<label
style={{
display: "block",
marginBottom: "7px",
}}
>
Status
</label>

<select
style={inputStyle}
value={status}
onChange={(e) =>
setStatus(e.target.value)
}
>
<option value="Booked">
Booked
</option>
<option value="Collected">
Collected
</option>
<option value="In Transit">
In Transit
</option>
<option value="Delivered">
Delivered
</option>
</select>

{status === "Delivered" && (
<>
<input
type="text"
style={inputStyle}
placeholder="Received by"
value={receivedBy}
onChange={(e) =>
setReceivedBy(e.target.value)
}
/>

<label
style={{
display: "block",
marginBottom: "8px",
}}
>
Proof of delivery photo
</label>

<input
type="file"
accept="image/*"
capture="environment"
style={inputStyle}
onChange={(e) =>
setPodFile(
e.target.files?.[0] || null
)
}
/>

{existingPod && (
<div
style={{
marginBottom: "18px",
}}
>
<p>
Existing proof of delivery:
</p>

<img
src={existingPod}
alt="Proof of delivery"
style={{
width: "100%",
maxWidth: "450px",
maxHeight: "350px",
objectFit: "contain",
borderRadius: "8px",
}}
/>
</div>
)}
</>
)}

<button
type="submit"
disabled={loading}
style={primaryButton}
>
{loading
? "Updating..."
: "Update Delivery"}
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
key={
delivery.id ||
delivery.tracking_number
}
style={{
backgroundColor: "#2b2b2b",
padding: "18px",
marginBottom: "14px",
borderRadius: "10px",
}}
>
<h3
style={{
marginTop: "0",
marginBottom: "12px",
}}
>
{delivery.tracking_number}
</h3>

<p>
<strong>Status:</strong>{" "}
{delivery.status}
</p>

{delivery.customer_name && (
<p>
<strong>Customer:</strong>{" "}
{delivery.customer_name}
</p>
)}

{delivery.customer_phone && (
<p>
<strong>Phone:</strong>{" "}
{delivery.customer_phone}
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

{delivery.pod_photo && (
<p>
Proof of delivery available
</p>
)}

<button
type="button"
onClick={() =>
selectDelivery(delivery)
}
style={{
padding: "11px 16px",
border: "none",
borderRadius: "6px",
backgroundColor: "#e53935",
color: "#ffffff",
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
