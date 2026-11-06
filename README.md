# Sona & Chandi Gold Collection — Operations Guide

A digital storefront and live bullion pricing system for **Sona & Chandi Gold Collection** (Pakistani Fine Jewellery).

---

## 1. What the Site Is

Sona & Chandi Gold Collection is a specialized jewellery e-commerce catalogue and live bullion price estimator. Unlike conventional stores with static retail pricing, this application calculates item prices transparently from official market bullion rates:

- **Mathematical Pricing Engine**: Every price is calculated strictly as:  
  $$\text{Price} = (\text{Weight in Grams} \times \text{Today's Per-Gram Metal Rate}) + \text{Making Charge}$$
- **Authentic Conversions**: Uses the standard Pakistani and international bullion conversion:  
  $$1\text{ tola} = 11.6638\text{ grams}$$
- **Direct WhatsApp Ordering**: Customers configure their desired items or cart and submit an order inquiry directly to your showroom WhatsApp desk with pre-formatted item specifications (SKU, weight, karat, and live estimate).

---

## 2. System Requirements & Node 24

Building and deploying this project requires **Node.js 24**:

```json
"engines": {
  "node": ">=24.0.0"
}
```

### Quick Commands

```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Compile production bundle
npm run build

# Verify TypeScript types and code health
npm run lint
```

---

## 3. How to Update Daily Bullion Rates

1. Open the storefront and navigate to `/admin` or click **"Staff Portal"** at the bottom of the page.
2. Sign in with your authorized staff Google account.
3. Click the **"Bullion Rates"** tab:
   - **24K Gold Rate**: Enter today's 24K gold rate per tola in PKR (e.g. `295000`).
   - **Fine Silver Rate**: Enter today's silver rate per tola in PKR (e.g. `3400`).
4. Click **"Publish Live Rates"**.
5. The new rates update storewide **instantaneously** across all product cards, detail pages, and the top live-rate ticker in real-time via Google Cloud Firestore—no rebuild or redeploy is required.

---

## 4. How to Add and Manage Products & Photos

1. In the Staff Portal, open the **"Product Catalogue"** tab.
2. Click **"Add New Product"** and complete the form:
   - **Product Title & SKU**: Give a descriptive name and unique code (e.g. `SC-NK-001`).
   - **Metal & Karat**: Select Gold (24K, 22K, 21K, 18K) or Silver (925).
   - **Gross Weight**: Enter total weight in grams (the system automatically displays the equivalent in tolas).
   - **Making Charge**: Choose either *Per Gram* (e.g. Rs. 1,500/g) or *Fixed* (e.g. Rs. 8,000 flat).
   - **Stock Quantity**: Active stock count (setting to `0` automatically flags the item as *Made to Order* on WhatsApp).
   - **Product Photos**: Upload high-resolution images or paste image URLs. Up to 6 photos per piece are supported.
3. Click **"Save Product"**. The piece appears immediately in the public catalogue.

---

## 5. How to Edit Storefront Showcase Tiles

1. In the Staff Portal, open the **"Storefront Showcase"** tab.
2. Customize the six collection spotlight cards on the homepage (Bridal Sets, Bangles & Karas, Jhumkas & Balis, Necklaces, Gold Rings, Silver):
   - Reorder cards using the **Up** / **Down** buttons.
   - Toggle visibility on or off.
   - Edit the card title and subtitle.
   - Upload custom curated photography, or leave empty to automatically display the newest active piece from that category.

---

## 6. How Customer Orders Appear in Customer Enquiries

1. When a shopper clicks **"Order on WhatsApp"** in their jewellery bag:
   - The WhatsApp link opens immediately with prefilled order details.
   - An enquiry record is logged simultaneously to Firestore and a confirmation badge (`Saved for our team`) is displayed.
2. In the Staff Portal, open the **"Customer Enquiries"** tab to view:
   - Customer name and WhatsApp contact number.
   - Fulfilment method (*Courier Delivery* with delivery city and street address, or *Showroom Pickup*).
   - Complete item breakdown with weights, karats, and estimated totals at the time of inquiry.
   - Inquiry status pipeline: `New` → `Contacted` → `Awaiting Customer` → `Confirmed` → `Completed` → `Cancelled`.
   - Internal staff notes for order tracking.

---

## 7. How to Add Staff & Manage Access Roles

1. In the Staff Portal, open the **"Staff Access"** tab (accessible by Owners).
2. Click **"Add Staff Member"**.
3. Enter the staff member's Google account email and select their role:
   - `owner`: Full access to rates, products, staff roster, store configuration, and enquiries.
   - `rate_manager`: Can update daily gold and silver market rates and audit history.
   - `product_manager`: Can add, edit, and adjust catalogue inventory and photos.
   - `support`: Can view and update customer inquiries and order statuses.
   - `viewer`: Read-only access to portal dashboards.
4. Only emails explicitly listed in the Firestore `staff` collection can access the management portal.

---

## 8. Connected Accounts & Services

The platform connects to the following production accounts:

1. **Google Firebase / Google Cloud**:
   - **Firestore Database**: Stores products, live bullion rates, rate audit history, store settings, staff accounts, and customer inquiries (`firebase-applet-config.json`).
   - **Firebase Authentication**: Secures the Staff Portal via Google OAuth.
2. **Cloudinary (Optional)**:
   - Used for cloud image storage and automated optimization (`f_auto,q_auto`).
   - Configurable in the Staff Portal under **"Store Configuration"** with your Cloud Name and Unsigned Upload Preset.
3. **GitHub**:
   - Houses the application source code and deployment workflows.
4. **Hosting**:
   - Google Cloud Run containerized service running Vite on port 3000.
