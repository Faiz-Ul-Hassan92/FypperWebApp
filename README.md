# Final Year Project Grouping Platform (MERN)

This application provides a platform for university students to form groups for their final year projects, request supervisors, and collaborate with recruiters.

## Features

*   **User Roles:** Student, Supervisor, Recruiter, Admin
*   Secure Authentication (Register/Login)
*   Students can create/manage projects.
*   Students can browse projects and request to join.
*   Students can request supervisors for their projects.
*   Students can request collaboration with recruiters.
*   Project owners, supervisors, and recruiters can approve/reject requests.
*   Admin panel for user management (view/delete).

## Technology Stack

*   **Frontend:** React.js (JavaScript)
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (using Mongoose)
*   **Authentication:** JWT (JSON Web Tokens), bcryptjs

## Project Structure

```
/final-year-project-platform
|-- /client             # React Frontend
|-- /server             # Express Backend
`-- README.md
```

## Setup and Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <your-repo-url>
    cd final-year-project-platform
    ```

2.  **Backend Setup:**
    *   Navigate to the server directory:
        ```bash
        cd server
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Create a `.env` file in the `server` directory.
    *   Copy the contents of `.env.example` (if provided) or add the following environment variables:
        ```env
        # MongoDB Connection String (Replace with your actual Atlas URI)
        MONGO_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING

        # JWT Secret Key (Replace with a strong, random string)
        JWT_SECRET=YOUR_SUPER_SECRET_RANDOM_STRING

        # Server Port (Optional, defaults to 5000)
        PORT=5000
        ```
    *   **Important:** Replace placeholders with your actual MongoDB Atlas connection string and a secure JWT secret.

3.  **Frontend Setup:**
    *   Navigate to the client directory:
        ```bash
        cd ../client
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   **(Optional/Recommended)** Create a `.env` file in the `client` directory.
    *   Add the base URL for your backend API:
        ```env
        REACT_APP_API_URL=http://localhost:5000/api
        ```
        (Adjust the port if your server runs on a different one).

## Running the Application

1.  **Run the Backend Server:**
    *   Navigate to the `server` directory:
        ```bash
        cd server
        ```
    *   Start the server (development mode with nodemon):
        ```bash
        npm run dev
        ```
    *   Or, start the server (production mode):
        ```bash
        npm start
        ```
    *   The server should start on the port specified in your `.env` file (default: 5000).

2.  **Run the Frontend Client:**
    *   Navigate to the `client` directory:
        ```bash
        cd ../client
        ```
    *   Start the React development server:
        ```bash
        npm start
        ```
    *   This will usually open the application automatically in your default web browser at `http://localhost:3000` (or another port if 3000 is busy).

## Further Development

This generated code provides the foundational structure. Significant development is required to implement the full functionality:

*   **Backend:** Flesh out controller logic, add detailed authorization checks, implement data validation, refine error handling, add cleanup logic (e.g., when deleting users or projects).
*   **Frontend:** Build out UI components, implement state management (using Context API or another library like Redux), connect components to API endpoints using the service functions, handle form submissions, display data, implement conditional rendering based on user roles and permissions, add styling. 