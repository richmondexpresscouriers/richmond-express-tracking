"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminPage() {
const [trackingNumber, setTrackingNumber] = useState("");
const [status, setStatus] = useState("Booked");
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

const [customerName, setCustomerName] = useState("");
const [collectionAddress, setCollectionAddress] = useState("");
const [deliveryAddress, setDeliveryAddress] = useState("");
const [estimatedDelivery, setEstimatedDelivery] = useState("");

const [deliveries, setDeliveries] = useState([]);

async function loadDeliveries() {
const { data, error } = await supabase
.from("Deliveries")
.select("*")
.order("tracking_number", { ascending: false });

if (error) {
setMessage("Error: " + error.message);
return;
}

setDeliveries(data || []);
}

useEffect(() => {
loadDeliveries();
}, []);

async function addDelivery(e) {
e.preventDefault();
setLoading(true);
setMessage("");

const { data: latestDelivery, error: lookupError } = await supabase
.from("Deliveries")
.select("tracking_number")
.order("tracking_number", { ascending: false })
.limit(1)
.maybeSingle();

if (lookupError) {
setMessage("Error: " + lookupError.message);
setLoading(false);
return;
}

let nextNumber = 1001;

if (latestDelivery?.tracking_number) {
const currentNumber = parseInt(
latestDelivery.tracking_number.replace("REC-", ""),
10
);

if (!Number.isNaN(currentNumber)) {
nextNumber = currentNumber + 1;
}
}

const number = `REC-${String(nextNumber).padStart(4, "0")}`;

if (!collectionAddress || !deliveryAddress) {
setMessage("Please fill in the required delivery details.");
setLoading(false);
return;
}

const { error } = await supabase.from("Deliveries").insert({
tracking_number: number,
customer_number: customerName,
collection_address: collectionAddress,
delivery_address: deliveryAddress,
estimated_delivery: estimatedDelivery || null,
status: "Booked",
});

if (error) {
setMessage("Error: " + error.message);
} else {
setMessage(number + " created successfully");

await loadDeliveries();

setCustomerName("");
setCollectionAddress("");
setDeliveryAddress("");
setEstimatedDelivery("");
}

setLoading(false);
}

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
.from("Deliveries")
.update(updates)
.eq("tracking_number", number)
.select();

if (error) {
setMessage("Error: " + error.message);
} else if (!data || data.length === 0) {
setMessage("Tracking number not found.");
} else {
setMessage(number + " updated to " + status);
await loadDeliveries();
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
maxWidth: "700px",
margin: "0 auto",
}}
>
<h1>Delivery Admin</h1>

<h2>Add New Delivery</h2>

<form onSubmit={addDelivery}>
<p>Customer name</p>
<input
type="text"
value={customerName}
onChange={(e) => setCustomerName(e.target.value)}
placeholder="Customer name"
style={{
width: "100%",
padding: "15px",
boxSizing: "border-box",
}}
/>

<p>Collection address</p>
<input
type="text"
value={collectionAddress}
onChange={(e) => setCollectionAddress(e.target.value)}
placeholder="Collection address"
required
style={{
width: "100%",
padding: "15px",
boxSizing: "border-box",
}}
/>

<p>Delivery address</p>
<input
type="text"
value={deliveryAddress}
onChange={(e) => setDeliveryAddress(e.target.value)}
placeholder="Delivery address"
required
style={{
width: "100%",
padding: "15px",
boxSizing: "border-box",
}}
/>

<p>Estimated delivery</p>
<input
type="datetime-local"
value={estimatedDelivery}
onChange={(e) => setEstimatedDelivery(e.target.value)}
style={{
width: "100%",
padding: "15px",
boxSizing: "border-box",
}}
/>

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
{loading ? "Creating..." : "Add Delivery"}
</button>
</form>

<hr style={{ margin: "35px 0" }} />

<h2>Update Delivery</h2>

<form onSubmit={updateDelivery}>
<p>Tracking number</p>
<input
type="text"
value={trackingNumber}
onChange={(e) => setTrackingNumber(e.target.value)}
placeholder="REC-1001"
style={{
width: "100%",
padding: "15px",
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

{message && (
<p style={{ marginTop: "25px" }}>
{message}
</p>
)}

<hr style={{ margin: "35px 0" }} />

<h2>Current Deliveries</h2>

{deliveries.length === 0 ? (
<p>No deliveries found.</p>
) : (
deliveries.map((delivery) => (
<div
key={delivery.tracking_number}
style={{
padding: "15px",
marginBottom: "15px",
border: "1px solid #ccc",
}}
>
<strong>{delivery.tracking_number}</strong>

<p>Status: {delivery.status}</p>

<p>
Collection: {delivery.collection_address}
</p>

<p>
Delivery: {delivery.delivery_address}
</p>

<button
type="button"
onClick={() => {
setTrackingNumber(delivery.tracking_number);
setStatus(delivery.status);
window.scrollTo({
top: 0,
behavior: "smooth",
});
}}
style={{
padding: "10px 15px",
cursor: "pointer",
}}
>
Select Delivery
</button>
</div>
))
)}
</div>
</main>
);
}
