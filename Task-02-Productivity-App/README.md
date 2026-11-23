# Daymark — Productivity Task Manager

Daymark is a responsive task manager built with **HTML, CSS, and vanilla JavaScript**. Its visual style uses a warm, understated palette, editorial typography, and subtle transitions to keep the interface calm and focused.

## Features

- Create, view, edit, and delete tasks
- Organize tasks into Work, Personal, Study, and Other categories
- Add optional due dates, with Today and overdue indicators
- Mark tasks complete or move them back to Active
- Filter by All, Active, and Completed
- Search task titles and categories
- Drag and drop tasks to change their order
- View task totals and clear completed tasks
- Persist tasks with `localStorage` across page reloads
- Responsive layout, keyboard shortcuts, hover states, and reduced-motion support

## Run locally

No build tools or dependencies are required.

1. Download or clone this project.
2. Open `index.html` in a modern web browser.

For a local development server, you can also run:

```bash
python -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000) in your browser (from the project directory).

## Data storage

Tasks are stored in the browser under the localStorage key `daymark.tasks.v1`. Data remains on the current browser and device; it is not synced to an account or server. Clearing the browser's site data will remove the saved tasks.
