# ![Favicon](https://raw.githubusercontent.com/pkunv/zacre/master/public/favicon.ico) Zacre

![GitHub package.json version](https://img.shields.io/github/package-json/v/pkunv/zacre)

## Overview

Small WIP full-stack web builder.
Main goal is to allow user to build own personal portfolio, a blog or small e-commerce shop.
The engine has easy structure, by dividing web pages into layouts that are constructed of individual modules, that are responsible
for a specific thing on a typical website (navbar, hero section, blog post preview, etc.).
Created as a challenge for a full-stack framework.

Built with:

- **ultimate-express** (drop-in replacement for Express.js)
- **JSX renderer** using `preact-render-to-string`
- **Better Auth** for authentication
- **Prisma ORM**
- **DaisyUI** (Tailwind CSS component library)
- **Typescript**

## Features

- Admin panel
- Layout and webpage creation with drag-and-drop modules
- Authentication
- Module parameters
- Navbar, hero and footer modules
- Loading state (similiar to `<Suspense>` component in React)
- Debounced input search queries by using `[data-debounce=true]`, `[data-debounce-timeout=500]` and `[data-search-input=true]`

And many more to come!

## Requirements

To deploy Zacre, you will need at least Node.js 18 and a Postgres database.

## Installation

1. Create and populate .env file accordingly to .env.example.

2. Run `npm i`

3. Run `npm run db:push` and `npm run db:seed` to initialize your Zacre database.

4. Run `npm run build` or `npm run dev` for development server.

5. Run `npm run start`
