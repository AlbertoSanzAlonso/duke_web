# 🍔 Duke Burger Management System

A high-performance, real-time management platform designed for the food industry. This project provides a robust solution for handling orders, inventory, and financial accounting with a "premium-first" approach to UI/UX and system architecture.

## 🚀 Key Features

- **Real-time Order Monitoring**: Implementation of Server-Sent Events (SSE) for instant kitchen notifications and order tracking without polling.
- **AI-Powered Business Assistant (Duke Assist)**: Integrated LLM to assist staff with operational queries, sales analysis, and menu management.
- **Comprehensive Financial Suite**: Advanced accounting module with daily/weekly/monthly reports, automated balances, and fiscal export capabilities (PDF/Excel).
- **Inventory & Supplier Control**: Modular stock management system with automated alerts and supplier order tracking.
- **Kitchen Monitor**: specialized interface for kitchen staff to manage order flow with atomic state transitions.
- **Premium UI/UX**: Custom design system using Vanilla CSS, optimized for both desktop management and high-speed mobile operation in active service environments.

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 6 + Django REST Framework (DRF).
- **Database**: PostgreSQL (Production-ready via Supabase).
- **Caching & Streams**: Redis for high-performance data handling.
- **Asynchronous**: Async Django views for resilient SSE streaming.
- **Storage**: AWS S3 integration for media and dynamic assets.

### Frontend
- **Framework**: React 19 + Vite.
- **State Management**: Optimized React Hooks & Context API with memoization patterns for financial calculations.
- **Styling**: Vanilla CSS with a focus on CSS Variables and modern layout techniques (Grid/Flexbox).
- **Real-time**: EventSource API integration with exponential backoff and heartbeat resilience.

## 🏗️ Architecture Highlights

- **Modular Design**: The backend is organized into specialized domains (menu, inventory, sales, accounting), ensuring scalability and maintainability.
- **Dual-Rendering Engine**: Specialized UI logic that switches between high-density tables for desktop and native card layouts for mobile, avoiding common responsive table pitfalls.
- **Atomic Order Lifecycle**: Strict authority patterns for order states (from Kitchen to TPV) to ensure financial consistency and prevent double stock deductions.

## 📦 Installation & Setup

### Backend
1. Navigate to `/backend`.
2. Create and activate a virtual environment: `python -m venv venv`.
3. Install dependencies: `pip install -r requirements.txt`.
4. Configure your `.env` file (Database, S3, Groq API).
5. Run migrations: `python manage.py migrate`.
6. Start the server: `python manage.py runserver`.

### Frontend
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Configure `VITE_API_URL` in `.env`.
4. Start development server: `npm run dev`.

---

Developed with ❤️ for **Duke Burger** – *Excellence in every bite.*
