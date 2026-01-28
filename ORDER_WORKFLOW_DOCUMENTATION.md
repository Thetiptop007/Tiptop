# Order Management Workflow - Documentation

## Overview
This document explains the order management workflow in the TipTop restaurant system, detailing the responsibilities of admins and delivery partners.

## Order Status Flow

```
PENDING → ACCEPTED → READY → OUT_FOR_DELIVERY → DELIVERED
           ↓            ↓              ↓            ↓
        (Admin)    (Admin)    (Delivery Boy)  (Delivery Boy)
```

## Admin Responsibilities

### 1. Accept Orders (PENDING → ACCEPTED)
- **Who**: Admin only
- **When**: When a new order comes in
- **Action**: Click "Accept Order" button
- **API Endpoint**: `PATCH /api/v1/orders/:id/accept`
- **What happens**: 
  - Order moves from "New" section to "Accepted" section
  - Kitchen is notified to start preparing
  - Customer gets notification that order is accepted

### 2. Mark Ready (ACCEPTED → READY)
- **Who**: Admin only
- **When**: When food is prepared and packed
- **Action**: Click "Mark Ready" button
- **API Endpoint**: `PATCH /api/v1/orders/:id/ready`
- **What happens**:
  - Order moves to "Ready" section
  - Order becomes **visible to ALL delivery partners** in their app
  - Delivery partners can now claim this order
  - Customer gets notification that order is ready

### 3. Optional: Manually Assign Delivery Partner
- **Who**: Admin (optional)
- **When**: If admin wants to assign a specific delivery partner
- **Action**: Click "Assign Agent" button on ready orders
- **API Endpoint**: `PATCH /api/v1/orders/:id/assign`
- **Body**: `{ "partnerId": "delivery_partner_id" }`
- **Note**: **Mostly not used** - delivery partners claim orders themselves

## Delivery Partner Responsibilities

### 1. View Available Orders
- **API Endpoint**: `GET /api/v1/delivery/available-orders`
- **What they see**: All orders with status=READY that are not yet claimed
- **Screen**: Available Orders tab in delivery partner app

### 2. Claim Orders (READY → OUT_FOR_DELIVERY)
- **Who**: Delivery partner
- **When**: They select which orders they want to deliver
- **Action**: Click "Claim" or "Accept" button in their app
- **API Endpoint**: `POST /api/v1/delivery/claim-order/:orderId`
- **What happens**:
  - Order status changes to OUT_FOR_DELIVERY automatically
  - Order is assigned to the delivery partner
  - Order is removed from available orders list for other partners
  - Customer gets notification with delivery partner details
  - Admin can see delivery partner info on the order

### 3. Mark Delivered (OUT_FOR_DELIVERY → DELIVERED)
- **Who**: Delivery partner
- **When**: After delivering order to customer
- **Action**: Click "Mark Delivered" in their app
- **API Endpoint**: `PATCH /api/v1/orders/:id/deliver`
- **Body**: `{ "collectedAmount": 500, "changeFund": 50 }` (for COD orders)
- **What happens**:
  - Order status changes to DELIVERED
  - Customer gets delivery confirmation
  - Order moves to completed section

## Admin UI Changes in newtiptop

### Before (Incorrect):
```tsx
// Ready orders had "Out for Delivery" button
case "READY":
  return <button onClick={() => updateStatus("OUT_FOR_DELIVERY")}>
    Out for Delivery
  </button>;

// OUT_FOR_DELIVERY had "Mark Delivered" button  
case "OUT_FOR_DELIVERY":
  return <button onClick={() => updateStatus("DELIVERED")}>
    Mark Delivered
  </button>;
```

### After (Correct):
```tsx
// Ready orders show awaiting pickup status
case "READY":
  return <span>Awaiting Pickup</span>;

// OUT_FOR_DELIVERY shows status (delivery partner marks it)
case "OUT_FOR_DELIVERY":
  return <span>Out for Delivery</span>;
```

## Order Sections in Admin Panel

### 1. New Orders (PENDING)
- Show "Accept Order" button
- Admin clicks to accept

### 2. Accepted Orders
- Show "Mark Ready" button
- Admin clicks when food is ready

### 3. Ready Orders
- Show "Awaiting Pickup" status
- **Optional**: Show "Assign Agent" button (rarely used)
- **Delivery partners see these in their app**
- **Delivery partners claim them automatically**

### 4. Out for Delivery Orders
- Show delivery partner information:
  - Name
  - Phone
  - Vehicle number
- Show "Out for Delivery" status
- Admin **cannot** change status (partner marks delivered)

### 5. Delivered Orders
- Show completed status
- Show delivery partner info
- Archive after certain time

## Key Backend Endpoints

### Admin Endpoints
```javascript
// Accept order
PATCH /api/v1/orders/:id/accept
// Response: { status: "success", data: { order } }

// Mark ready
PATCH /api/v1/orders/:id/ready
// Response: { status: "success", data: { order } }

// Optional: Assign partner
PATCH /api/v1/orders/:id/assign
// Body: { "partnerId": "partner_id" }
// Response: { status: "success", data: { order } }

// Get all delivery partners
GET /api/v1/delivery/partners
// Response: { status: "success", data: { partners: [...] } }
```

### Delivery Partner Endpoints
```javascript
// Get available orders (READY status, unassigned)
GET /api/v1/delivery/available-orders
// Response: { status: "success", data: { orders: [...] } }

// Claim order
POST /api/v1/delivery/claim-order/:orderId
// Response: { status: "success", data: { order } }
// Order status automatically changes to OUT_FOR_DELIVERY

// Mark delivered
PATCH /api/v1/orders/:id/deliver
// Body: { "collectedAmount": 500, "changeFund": 50 }
// Response: { status: "success", data: { order } }
```

## Order Object Structure

```typescript
{
  _id: string;
  orderNumber: string;
  status: "PENDING" | "ACCEPTED" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED";
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  items: [...];
  pricing: {...};
  deliveryPartner?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    assignedAt: Date;
    pickedUpAt: Date;
  };
  // ... other fields
}
```

## Important Notes

1. **Admin cannot manually mark orders as OUT_FOR_DELIVERY**
   - This happens automatically when delivery partner claims the order
   
2. **Admin cannot manually mark orders as DELIVERED**
   - Only delivery partner can mark delivered from their app
   
3. **Manual assignment is optional**
   - Most of the time, delivery partners claim orders themselves
   - Admin can manually assign in special cases
   
4. **Ready orders are visible to ALL delivery partners**
   - First-come, first-served basis
   - Partners can see order details before claiming
   
5. **Race condition prevention**
   - Backend uses atomic operations (findOneAndUpdate)
   - If two partners try to claim same order, only one succeeds

## Delivery Partner App Screens

### 1. Available Orders Screen
- Shows all READY orders
- Delivery partner can view order details
- "Claim" button to accept the order

### 2. Assigned Orders Screen
- Shows orders they have claimed (OUT_FOR_DELIVERY)
- Customer details, address, items
- "Mark Delivered" button
- Call customer button
- Navigate to address button

### 3. Completed Orders Screen
- Shows their delivered orders
- Earnings summary
- Delivery history

## Testing Workflow

1. **Create order** (customer or admin)
2. **Admin accepts** → Status: ACCEPTED
3. **Admin marks ready** → Status: READY
4. **Delivery partner sees order** in Available Orders
5. **Delivery partner claims** → Status: OUT_FOR_DELIVERY
6. **Delivery partner delivers** → Status: DELIVERED

## Files Modified

### Frontend (newtiptop)
- `src/pages/Orders/OrderManagement.tsx`
  - Removed OUT_FOR_DELIVERY button for READY orders
  - Removed DELIVERED button for OUT_FOR_DELIVERY orders
  - Show proper status badges instead
  
- `src/services/order-management.service.ts`
  - Updated to use specific backend endpoints (/accept, /ready)
  - Removed generic status update endpoint

### Mobile App (TiptopApp)
- `src/screens/delivery/AvailableOrdersScreen.tsx`
  - Shows READY orders
  - Claim functionality
  
- `src/screens/delivery/AssignedDeliveriesScreen.tsx`
  - Shows OUT_FOR_DELIVERY orders
  - Mark delivered functionality

### Backend
- Already implemented correctly
- Routes and controllers handle the workflow properly
- No changes needed

## Summary

✅ **What Admin Does**:
- Accept new orders
- Mark orders ready when prepared
- (Optional) Manually assign delivery partner

❌ **What Admin Does NOT Do**:
- Mark orders as "Out for Delivery" (delivery partner claims it)
- Mark orders as "Delivered" (delivery partner marks it)

✅ **What Delivery Partner Does**:
- View available READY orders
- Claim orders they want to deliver
- Mark orders as delivered after delivery

🎯 **Result**: Efficient workflow where delivery partners have autonomy to select orders, reducing admin workload.
