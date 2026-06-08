# DSM Order Portal - Frontend

This is the frontend client for the DSM Order Portal, designed to capture and process order data for downstream integration with the COBRA system. 

## Tech Stack
* **Framework:** React.js (via Vite)
* **Styling:** Tailwind CSS v4
* **State Management:** Redux Toolkit
* **Routing:** React Router v6
* **Icons:** Lucide React

## Folder Architecture
* `/src/components` - Contains reusable UI elements and layout components (like the Navbar).
* `/src/pages` - Top-level route components representing distinct views.
* `/src/store` - Redux Toolkit store setup and feature slices.
* `/src/styles` - Global CSS, including the Tailwind v4 configuration directly in `globals.css`.

## Getting Started

1. Install dependencies:
   ```bash
   npm install