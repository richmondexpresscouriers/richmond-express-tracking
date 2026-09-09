'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL,
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

export default function Home() {
const [trackingNumber, setTrackingNumber] = useState('')
const [delivery, setDelivery] = useState(null)
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)

async function trackDelivery(e) {
e.preventDefault()

setLoading(true)
setError('')
setDelivery(null)

const { data, error } = await supabase
.from('Deliveries')
.select(
'tracking_number, collection_address, delivery_address, status, estimated_delivery, delivered_at, received_by'
)
.eq('tracking_number', trackingNumber.trim())
.maybeSingle()

if (error) {
  setError(error.message)
} else if (!data) {
  setError('Tracking number not found.')
} else { 
  setDelivery(data)
}

setLoading(false)
}

return (
<main style={{
minHeight: '100vh',
background: '#111',
color: 'white',
fontFamily: 'Arial, sans-serif',
padding: '40px 20px'
}}>
<div style={{
maxWidth: '700px',
margin: '0 auto',
background: '#1b1b1b',
padding: '30px',
borderRadius: '16px'
}}>
<h1 style={{ marginBottom: '8px' }}>
Richmond Express Couriers
</h1>

<p style={{ color: '#ccc', marginBottom: '30px' }}>
Track your delivery
</p>

<form onSubmit={trackDelivery}>
<input
type="text"
placeholder="Enter tracking number e.g. REC-1001"
value={trackingNumber}
onChange={(e) => setTrackingNumber(e.target.value)}
style={{
width: '100%',
padding: '14px',
fontSize: '16px',
marginBottom: '12px',
boxSizing: 'border-box'
}}
/>

<button
type="submit"
style={{
width: '100%',
padding: '14px',
background: '#e32636',
color: 'white',
border: 'none',
fontSize: '16px',
fontWeight: 'bold',
cursor: 'pointer'
}}
>
{loading ? 'Tracking...' : 'Track Delivery'}
</button>
</form>

{error && (
<p style={{ marginTop: '25px', color: '#ff6b6b' }}>
{error}
</p>
)}

{delivery && (
<div style={{ marginTop: '30px' }}>
<h2>{delivery.tracking_number}</h2>

<p>
<strong>Status:</strong> {delivery.status}
</p>
<div style={{ margin: "20px 0" }}>
<div style={{
display: "flex",
justifyContent: "space-between",
marginBottom: "8px",
fontWeight: "bold"
}}>
<span>Booked ✓</span>
<span>Collected</span>
<span>In Transit</span>
<span>Delivered</span>
</div>

<div style={{
height: "8px",
background: "#555",
borderRadius: "10px",
overflow: "hidden"
}}>
<div style={{
height: "100%",
background: "#ff4b3e",
borderRadius: "10px",
width:
delivery.status === "Delivered" ? "100%" :
delivery.status === "In Transit" ? "67%" :
delivery.status === "Collected" ? "34%" :
"10%"
}} />
</div>
</div>

<p>
<strong>Collection:</strong> {delivery.collection_address}
</p>

<p>
<strong>Delivery:</strong> {delivery.delivery_address}
</p>

{delivery.estimated_delivery && (
<p>
<strong>Estimated delivery:</strong>{' '}
{new Date(delivery.estimated_delivery).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
</p>
)}

{delivery.delivered_at && (
<p>
<strong>Delivered:</strong>{' '}
{new Date(delivery.delivered_at).toLocaleString()}
</p>
)}

{delivery.received_by && (
<p>
<strong>Received by:</strong> {delivery.received_by}
</p>
)}
</div>
)}

<p style={{
marginTop: '35px',
textAlign: 'center',
color: '#aaa',
fontSize: '13px'
}}>
FAST. RELIABLE. DELIVERED.
</p>
</div>
</main>
)
}
