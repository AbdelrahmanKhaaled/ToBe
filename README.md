# Admin Dashboard

Production-ready admin dashboard with clean architecture, class-based API services, and reusable components. Uses **JavaScript** (no TypeScript) and the **To Be** Dashboard API.

## Tech Stack

- **React 18** + **JavaScript**
- **Vite**
- **React Router**
- **Tailwind CSS**

## Brand Identity

- **Primary / Dark Neutral:** `#231F20` — Sidebar, headers, primary text
- **Accent / Action:** `#FF8000` — Buttons, active menu, focus states

## Project Structure

```
src/
├── api/                    # Class-based API layer
│   ├── BaseApiService.ts   # Base: base URL, headers, bearer token, error handling
│   ├── AuthService.ts
│   ├── CategoryService.ts
│   ├── LevelService.ts
│   ├── CourseService.ts
│   ├── LessonService.ts
│   ├── ArticleService.ts
│   ├── MentorService.ts
│   ├── FaqService.ts
│   └── index.ts
├── components/
│   ├── layout/             # Sidebar, Header, DashboardLayout
│   ├── ui/                 # Button, Input, Modal, DataTable, Loading, EmptyState, ConfirmDialog
│   └── ToastContainer.tsx
├── config/                 # API base URL
├── context/                # AuthContext
├── pages/                  # Login, DashboardHome, Categories, Levels, Mentors, Courses, Lessons, Articles, FAQs, Profile
├── theme/                  # Design tokens (colors)
├── types/                  # Shared types
├── utils/                  # authStorage, queryParams, pagination, toast, confirmDialog, fileUpload
├── App.tsx
├── main.tsx
└── index.css
```

## Setup

1. The API base URL is set in `.env`:

   ```
   VITE_API_BASE_URL=https://tobe.teamqeematech.site/api
   ```

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Build for production:

   ```bash
   npm run build
   ```

## Architecture

- **API:** All services extend `BaseApiService`. 401 → logout + redirect to login.
- **Auth:** Token stored in `localStorage`, attached to every request.
- **Utilities:** Centralized pagination, query params, toast, and confirmation dialogs.
- **UI:** Shared `DataTable`, `Modal`, `Button`, etc. No duplicated CRUD logic per page.

## API Endpoints (from Postman Collection)

All Dashboard APIs are under `https://tobe.teamqeematech.site/api/dashboard/`:

| Resource  | Endpoints                                      |
|-----------|-------------------------------------------------|
| Auth      | POST /login (urlencoded), POST /logout, GET /profile |
| Categories| GET/POST/DELETE, POST /:id?_method=PUT (formdata)    |
| Levels    | GET/POST/DELETE, POST /:id?_method=PUT (formdata)    |
| Mentors   | GET/POST/DELETE, POST /:id?_method=PUT (urlencoded)  |
| Courses   | GET/POST/DELETE, POST /:id?_method=PUT (formdata)    |
| Lessons   | GET/POST/DELETE, POST /:id?_method=PUT (formdata/urlencoded) |
| Articles  | GET/POST/DELETE, POST /:id?_method=PUT (formdata)    |
| FAQs      | GET/POST/DELETE, POST /:id?_method=PUT (formdata)    |

Bilingual fields use `_ar` and `_en` suffixes (e.g. name_ar, name_en).
