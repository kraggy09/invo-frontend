# InvoSync Frontend

InvoSync is a modern, high-performance billing and inventory management system designed for businesses. This project represents a significant evolution from its predecessor, [**Bill-Quil**](https://github.com/kraggy09/bill-quil), moving from a standard React-Context application to a distributed, event-driven frontend architecture.

---

## 📈 The Evolution: Bill-Quil ➡️ InvoSync

InvoSync was engineered to solve the performance and scalability bottlenecks discovered in Bill-Quil.

| Feature | Bill-Quil (Legacy) | InvoSync (Advanced) | Engineering Impact |
| :--- | :--- | :--- | :--- |
| **State Management** | React Context API | **Zustand (Atomic Store)** | Eliminated redundant re-renders in 50+ row billing tables. |
| **Tech Stack** | React 18 / Tailwind 3 | **React 19 / Tailwind 4** | Leveraged concurrent features and faster build times. |
| **Data Sync** | REST Polling / Manual Refresh | **Real-time WebSockets** | Sub-100ms synchronization across all connected clients. |
| **Input System** | Manual Form Focus | **Global Interrupt-Driven Scan** | Barcode scanning works regardless of input focus. |
| **UI consistency** | Custom CSS / Material UI | **Tailwind 4 + Ant Design 5** | Professional, high-performance design system. |

---

## 🧠 Frontend Engineering Highlights

### ⚡ Selective State Subscriptions (Zustand)
While Bill-Quil suffered from "re-render-hell" as the billing table grew, InvoSync utilizes **Zustand's shallow selectors**. This ensures that updating a single item's quantity doesn't re-render the entire table, maintaining 60FPS even with 30,000+ indexed products in memory.

### 🔍 Global Barcode Interceptor
Implementing an intuitive checkout experience was a priority. I engineered a global keyboard event listener hook that intelligently captures barcode inputs and routes them to the `useCurrentBillStore`, allowing users to scan items without having to manually focus on a specific input field.

### 🌐 Real-Time Inventory Sync
Using **Socket.io**, the frontend remains in perfect sync with the backend. When a stock update or a price change occurs (even from a different admin), the UI reflects the change instantly without requiring a page refresh.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Ant Design 5](https://ant.design/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Charts**: [Recharts](https://recharts.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)

---

## ✨ Core Features

- **Multi-tab Billing**: Manage up to 10 active bills simultaneously without performance degradation.
- **Dynamic Price Brackets**: Automatic switching between Retail, Wholesale, and Super-Wholesale rates based on volume or customer profiles.
- **Comprehensive CRM**: Full transaction and return history for every customer.
- **Inventory Audit**: Real-time stock tracking with automated request logs.
- **Live Analytics**: Interactive dashboards for sales, profit, and trends.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd invo-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the necessary backend URL (e.g., `VITE_API_BASE_URL`).
4. Start the development server:
   ```bash
   npm run dev
   ```

