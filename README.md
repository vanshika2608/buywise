# 🛒 BuyWise — Smart Shopping Assistant

![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow)
![Node](https://img.shields.io/badge/Backend-Node.js-green)
![Frontend](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-blue)
![Deployment](https://img.shields.io/badge/Deployment-Vercel-black)
![Status](https://img.shields.io/badge/Project-Active-success)
![Maintained](https://img.shields.io/badge/Maintained-Yes-brightgreen)

BuyWise is a **smart shopping assistant web application** that helps users make better purchasing decisions by exploring and comparing products in an intuitive interface.

The project demonstrates a **full-stack web application architecture**, combining a lightweight frontend with a backend API to manage product data and business logic.

---

# 🚀 Live Demo

🌐 [BuyWise](https://buywise-green.vercel.app/)

---

# ✨ Key Features

| Feature                | Description                            |
| ---------------------- | -------------------------------------- |
| 🛍 Product Exploration | Browse available products easily       |
| ⚡ Responsive UI        | Smooth and minimal interface           |
| 🔌 Backend API         | Server-side logic for product handling |
| 🧩 Modular Structure   | Clean separation of frontend & backend |
| ☁️ Deployment Ready    | Easily deployable on Vercel            |

---

# 🏗️ System Architecture

```
            ┌──────────────────┐
            │       User       │
            └────────┬─────────┘
                     │
                     ▼
            ┌──────────────────┐
            │     Frontend     │
            │ HTML • CSS • JS  │
            └────────┬─────────┘
                     │ API Requests
                     ▼
            ┌──────────────────┐
            │      Backend     │
            │  Node.js Server  │
            └────────┬─────────┘
                     │
                     ▼
            ┌──────────────────┐
            │   Product Data   │
            └──────────────────┘
```

---

# 📂 Project Structure

```
buywise
│
├── backend
│   ├── server.js
│   ├── routes
│   └── controllers
│
├── frontend
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── docs
│   ├── demo.gif
│   └── screenshots
│
└── README.md
```

---

# 🛠️ Tech Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Deployment

* Vercel

---

# ⚙️ Installation

Clone the repository

```
git clone https://github.com/vanshika2608/buywise.git
```

Move into the project folder

```
cd buywise
```

Install dependencies

```
npm install
```

---

# ▶️ Running the Project

Start backend server

```
cd backend
node server.js
```

Run frontend

Open `index.html` in your browser.

---

# 📡 Example API Endpoints

### Get all products

```
GET /api/products
```

### Get product by ID

```
GET /api/products/:id
```

### Add new product

```
POST /api/products
```

Example response:

```
{
  "id": 1,
  "name": "Laptop",
  "price": 60000,
  "rating": 4.5
}
```

---

# 📸 Screenshots

Add screenshots inside the **docs folder**.

Example:

```
docs/homepage.png
docs/products.png
```

Then reference them like:

```
![Homepage](docs/homepage.png)

![Products](docs/products.png)
```

---

# 🚧 Future Improvements

* 🔍 Product price comparison across platforms
* 🤖 AI-based purchase recommendations
* 🔐 User authentication system
* ❤️ Wishlist functionality
* 📊 Spending analytics dashboard

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a Pull Request

---

# 📜 License

This project is licensed under the **MIT License**.

---

# 👩‍💻 Author

**Vanshika Deswal**

GitHub
https://github.com/vanshika2608

---

⭐ If you found this project useful, consider **starring the repository**.
