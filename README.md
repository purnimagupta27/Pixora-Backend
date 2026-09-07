<div align="center">

<!-- Animated Header Wave Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=23,24,25&height=220&section=header&text=PIXORA%20API%20ENGINE&fontSize=42&fontAlignY=38&desc=Next-Gen%20Express%205%20%E2%80%A2%20Neon%20Postgres%20%E2%80%A2%20Drizzle%20ORM%20%E2%80%A2%20Cloudinary&descAlignY=60&descAlign=50" alt="Pixora API Banner" width="100%" />

<!-- Dynamic Animated Typing Text -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Plus+Jakarta+Sans&weight=700&size=24&duration=3000&pause=1000&color=E60023&center=true&vCenter=true&multiline=false&width=620&height=50&lines=⚡+High-Performance+Engine+for+Pixora;🛡️+Strict+Zod+Validation+%2B+HttpOnly+JWT;💾+Neon+Serverless+PostgreSQL+%2B+Drizzle+ORM;☁️+Direct+Media+Pipelines+with+Cloudinary;✨+Clean+Architecture%3A+DTOs%2C+Controllers%2C+Models" alt="Animated Typing Subtitle" />
</a>

<br/>

<!-- Modern Shields & Tech Stack Badges -->
[![Node.js](https://img.shields.io/badge/Node.js_v20+-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express 5](https://img.shields.io/badge/Express_5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Neon Postgres](https://img.shields.io/badge/Neon_PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Zod](https://img.shields.io/badge/Zod_Validation-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev)

</div>

---

<div align="center">
  <h3>🌟 Explore • Pin • Organize • Connect on Pixora 🌟</h3>
  <p>
    Welcome to the <b>Pixora Backend Engine</b> (v2)! A production-grade REST API engineered for speed, reliability, and security. Powering seamless visual discovery, smart boards, social interactions, and instant cloud image delivery.
  </p>
</div>

---

## ⚡ Quick Navigation

<div align="center">

| 🚀 [Quick Start (60s)](#-60-second-quick-start) | 🧠 [Architecture](#-system-architecture) | 🗄️ [Database Schema](#-database-blueprint) |
| :---: | :---: | :---: |
| 📡 [API Endpoints](#-api-cheat-sheet) | 📁 [Code Tour](#-under-the-hood-code-tour) | 🔒 [Auth & Security](#-security--session-management) |

</div>

---

## 🚀 60-Second Quick Start

Get the backend running locally in **3 easy steps**:

### 1️⃣ Clone & Install
```bash
# Navigate to this folder
cd 02-pinterest

# Install dependencies
npm install
```

### 2️⃣ Configure Environment
Create a `.env` file in `02-pinterest/`:
```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
POSTGRES_URL=postgresql://username:password@ep-cool-db.neon.tech/neondb?sslmode=require
SECRET_KEY=your_super_secret_jwt_key
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

### 3️⃣ Sync DB & Launch!
```bash
# Push database tables to Neon PostgreSQL
npx drizzle-kit push

# Start the server with live reload
npm start
```
🎉 **Server is live at:** `http://localhost:5000`

---

## 🧠 System Architecture

Here is how data flows from the frontend down to our database and media cloud:

```mermaid
flowchart TD
    subgraph Client ["🖥️ Client (Browser / React 19)"]
        Req["HTTP Request + auth_token Cookie"]
    end

    subgraph Security ["🛡️ Express Middleware Chain"]
        CORS["CORS (Credentials Allowed)"]
        Parser["Cookie & JSON Body Parser"]
        AuthMW{"Authenticated?"}
    end

    subgraph Controllers ["⚙️ Business Logic Layer"]
        AuthController["Auth Controller"]
        PostController["Post & Feed Controller"]
        BoardController["Board Controller"]
        SocialController["Likes, Comments & Follows"]
    end

    subgraph Cloud ["☁️ Data & Cloud Infrastructure"]
        ZodValidator["Zod DTO Validator"]
        CloudinaryCDN[("Cloudinary Media CDN")]
        DrizzleORM["Drizzle ORM Engine"]
        NeonDB[("Neon Serverless PostgreSQL")]
    end

    Req --> CORS --> Parser --> AuthMW
    AuthMW -->|Public Route| AuthController
    AuthMW -->|Valid Token| Controllers
    AuthMW -->|Unauthorized| Err401["401 Unauthorized Response"]

    Controllers --> ZodValidator
    PostController -->|Image Upload| CloudinaryCDN
    Controllers --> DrizzleORM
    DrizzleORM --> NeonDB
```

---

## 🗄️ Database Blueprint

Our relational schema is built with **PostgreSQL** and managed using **Drizzle ORM**, featuring strict UUID keys and automatic cascade deletion:

```mermaid
erDiagram
    USERS ||--o{ POSTS : "creates"
    USERS ||--o{ BOARDS : "owns"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ LIKES : "gives"
    USERS ||--o{ FOLLOWS : "follows / followed_by"
    BOARDS ||--o{ BOARD_POST : "contains"
    POSTS ||--o{ BOARD_POST : "grouped_in"
    POSTS ||--o{ COMMENTS : "has"
    POSTS ||--o{ LIKES : "receives"

    USERS {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar password
        varchar nickname
        varchar url
    }

    POSTS {
        uuid id PK
        uuid user_id FK
        text url "Cloudinary Image Link"
        varchar caption
        boolean is_private
    }

    BOARDS {
        uuid id PK
        uuid user_id FK
        varchar name
    }

    BOARD_POST {
        uuid id PK
        uuid board_id FK
        uuid post_id FK
    }

    LIKES {
        uuid id PK
        uuid user_id FK
        uuid post_id FK
    }

    COMMENTS {
        uuid id PK
        uuid user_id FK
        uuid post_id FK
        text message
    }

    FOLLOWS {
        uuid id PK
        uuid follower_id FK
        uuid following_id FK
    }
```

---

## 📡 API Cheat Sheet

All routes are prefixed with `/api`.

<details open>
<summary><b>🔑 Authentication & User Profile (Click to expand)</b></summary>
<br>

| Method | Endpoint | Auth | Description | Payload Sample |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/signup` | ❌ | Create new account | `{"username": "alex", "email": "a@pin.com", "password": "SecretPassword1@"}` |
| `POST` | `/api/auth/signin` | ❌ | Login & receive `auth_token` cookie | `{"email": "a@pin.com", "password": "SecretPassword1@"}` |
| `GET` | `/api/auth/me` | ✅ | Current user profile, stats & pins | *None* |
| `POST` | `/api/auth/logout` | ✅ | Clear authentication cookie | *None* |
| `GET` | `/api/user/:userId` | ✅ | View any creator's public profile | *None* |

</details>

<details open>
<summary><b>📌 Posts & Feeds</b></summary>
<br>

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/posts/create-post` | ✅ | Upload image & publish pin | `multipart/form-data`: `image`, `caption`, `isPrivate` |
| `GET` | `/api/posts/feed` | ✅ | Global Explore feed (public pins) | *None* |
| `GET` | `/api/posts/feed/following`| ✅ | Pins only from users you follow | *None* |
| `GET` | `/api/posts/my-posts` | ✅ | All pins created by you | *None* |
| `GET` | `/api/posts/post/:id` | ✅ | Detailed view of a single pin | *None* |
| `PATCH`| `/api/posts/my-post/:id` | ✅ | Edit pin caption or privacy | `{"caption": "Updated caption", "isPrivate": false}` |
| `DELETE`| `/api/posts/my-post/:id` | ✅ | Delete your pin permanently | *None* |

</details>

<details>
<summary><b>🗂️ Boards & Collections</b></summary>
<br>

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/boards/create-board` | ✅ | Create a new board (`{"name": "Dream Living Room"}`) |
| `GET` | `/api/boards/my-boards` | ✅ | List all boards you created |
| `GET` | `/api/boards/:boardId/posts` | ✅ | Get all pins saved inside a board |
| `POST` | `/api/boards/:boardId/add-post/:postId` | ✅ | Save a pin into a board |
| `DELETE`| `/api/boards/:boardId/remove-post/:postId` | ✅ | Remove a pin from a board |
| `GET` | `/api/boards/status/:postId` | ✅ | Check if current post is bookmarked |
| `DELETE`| `/api/boards/:boardId` | ✅ | Delete a board |

</details>

<details>
<summary><b>❤️ Likes, Comments & Follows</b></summary>
<br>

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/likes/post/:postId` | ✅ | Like a pin |
| `DELETE`| `/api/likes/post/:postId` | ✅ | Remove like from pin |
| `POST` | `/api/comments/post/:postId` | ✅ | Add comment (`{"message": "Love this aesthetic!"}`) |
| `GET` | `/api/comments/:postId` | ✅ | Retrieve comments list with user avatars |
| `DELETE`| `/api/comments/:commentId` | ✅ | Delete your comment |
| `POST` | `/api/follows/:userId` | ✅ | Follow another creator |
| `DELETE`| `/api/follows/:userId` | ✅ | Unfollow a creator |
| `GET` | `/api/follows/:userId` | ✅ | Check if you follow this creator |

</details>

---

## 📁 Under-The-Hood: Code Tour

Understanding how the code is organized makes extending it a breeze:

```bash
02-pinterest/
├── 📂 drizzle/              # Auto-generated SQL migration history
├── 📂 src/
│   ├── 📂 controllers/      # 🎯 The Brain: Handles incoming requests & responses
│   │   ├── auth.controller.js      # Sign-up, sign-in, token generation
│   │   ├── post.controller.js      # Feed curation, uploads, post edits
│   │   ├── boards.controller.js    # Pin bookmarking & board management
│   │   ├── follows.controller.js   # Social graph & follower counts
│   │   ├── likes.controller.js     # Post like toggles & counts
│   │   └── comments.controller.js  # Comment streams & deletions
│   │
│   ├── 📂 dto/              # 🛡️ The Shield: Zod validation schemas for inputs
│   │   ├── auth.dto.js             # Strong password rules & email checks
│   │   └── post.dto.js             # Caption length & boolean privacy parsing
│   │
│   ├── 📂 middlewares/      # 🚦 The Checkpoints: Security & uploads
│   │   ├── auth.middleware.js      # Verifies JWT cookies, blocks imposters
│   │   └── multer.middleware.js    # Buffers uploaded image files safely
│   │
│   ├── 📂 models/           # 🗄️ The Database: Drizzle PostgreSQL table blueprints
│   │   ├── users.model.js          # User profiles & credentials
│   │   ├── posts.model.js          # Pin media URLs & captions
│   │   ├── boards.model.js         # Collection boards
│   │   ├── boardPost.model.js      # Board-to-Post join table
│   │   ├── likes.model.js          # Unique user-post like indexes
│   │   ├── follows.model.js        # Self-follow prevention checks
│   │   └── main.model.js           # Schema aggregator for Drizzle
│   │
│   ├── 📂 routes/           # 🗺️ The Map: Connects URLs to controllers
│   │
│   ├── 📂 utils/            # 🧰 The Toolkit: Shared helpers
│   │   ├── api-response.js         # Standard JSON response format
│   │   ├── api-error.js            # Clean HTTP error responses
│   │   ├── cloudinary.js           # Cloud upload pipeline
│   │   └── token.js                # JWT sign & verify
│   │
│   ├── app.js               # 🚀 Express setup, CORS, JSON parsers, route mounts
│   └── index.js             # 🔌 Neon PostgreSQL connection instance
│
├── .env                     # Secrets & environment config
├── drizzle.config.js        # Drizzle Kit CLI configuration
├── main.js                  # 🏁 HTTP Server entrypoint
└── package.json             # Dependencies & start scripts
```

---

## 🔒 Security & Session Management

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Server as Express 5 Server
    participant DB as Neon PostgreSQL

    User->>Server: POST /api/auth/signin (email, password)
    Server->>DB: Query user by email
    DB-->>Server: User record with hashed password
    Server->>Server: bcrypt.compare(password, hash)
    Server->>Server: Sign JWT token with SECRET_KEY
    Server-->>User: Set-Cookie: auth_token=jwt; HttpOnly; SameSite; Secure
    Note over User,Server: Token is stored securely in cookie (Immune to XSS)

    User->>Server: GET /api/posts/feed (Cookie sent automatically)
    Server->>Server: auth.middleware verifies JWT
    Server->>DB: Fetch posts
    DB-->>Server: Post collection
    Server-->>User: 200 OK + JSON data
```

### Why This Setup is Rock-Solid:
- 🛡️ **HttpOnly Cookie**: JavaScript cannot read the token, making token theft via XSS impossible.
- ⚡ **Neon Serverless**: Auto-scaling PostgreSQL with zero cold-start headaches.
- 🧹 **Cascade Cleanups**: If a post is deleted, its likes, comments, and board saves are instantly pruned.
- 🔒 **Self-Follow Safeguards**: Database-level check constraints prevent users from following themselves.

---

## 🛠️ Handy Database Commands

```bash
# Push schema updates directly to Neon
npx drizzle-kit push

# Launch visual database GUI in your browser
npx drizzle-kit studio

# Generate migration files
npx drizzle-kit generate
```

---

<div align="center">

<!-- Footer Wave Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=23,24,25&height=120&section=footer" alt="Footer Banner" width="100%" />

<p>
  <b>Crafted with ❤️ for the Pixora Fullstack Experience</b>
  <br/>
  <i>Scalable • Modular • Fast</i>
</p>

</div>
