# ContribAI

ContribAI is an LLM-powered Open Source Contribution Assistant designed to help maintainers and contributors discover and propose high-quality GitHub issues. It systematically scans repositories for deterministic signals and uses generative AI to draft clear, helpful, and professional issues.

![ContribAI Dashboard](https://github.com/user-attachments/assets/4fa9cb4b-b12f-4990-b2a1-9348fe5ecede)

## 🚀 Features

- **GitHub OAuth Integration**: Securely connect your GitHub account to manage repositories and publish issues directly.
- **Deterministic Scanning**: Efficiently identifies technical debt and contribution opportunities:
  - `TODO` and `FIXME` comments.
  - Exported functions missing JSDoc/documentation.
  - Source files missing companion test files.
- **Incremental & Resumable Scans**: Large repositories are scanned in batches with cursor tracking, allowing you to pause, resume, or cancel active scans.
- **Real-time Progress Tracking**: Live progress bars and activity logs keep you informed of the scanning phases and currently processed files.
- **AI-Powered Drafting (Gemini)**: Uses Google's Gemini Flash 2.5 with structured output to classify signal worthiness and draft issues with perfect Markdown formatting.
- **Human-in-the-Loop Workflow**: Never publish AI-generated content blindly. Review, edit, and approve drafts before they go live on GitHub.
- **Rich Markdown Preview**: Full GFM (GitHub Flavored Markdown) support with native syntax highlighting for all major programming languages.
- **Modern UI/UX**: A polished, responsive dashboard built with Framer Motion, Tailwind CSS, and a premium aesthetic.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Markdown**: React-Markdown, Remark-GFM, React-Syntax-Highlighter
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js, Express, TypeScript
- **Database**: MySQL with Sequelize ORM
- **Queue System**: BullMQ with Redis
- **Logger**: Winston (Structured JSON logging)
- **AI Integration**: Google Gemini API

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MySQL](https://www.mysql.com/)
- [Redis](https://redis.io/) (Required for scan job queue)

### 1. Clone the repository
```bash
git clone https://github.com/vibhanshu2001/github-issue-finder.git
cd issue-tracker
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
PORT=3001
DATABASE_URL=mysql://user:password@localhost:3306/issue_tracker
GEMINI_API_KEY=your_gemini_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/callback
JWT_SECRET=your_jwt_secret
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```

Start the frontend:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛡️ Safety & Cost Control

ContribAI is designed to be conservative and cost-effective:
- **Batch Processing**: Only processes a specific number of high-priority files per scan.
- **Classification Phase**: Uses a two-step LLM process (Classify -> Draft) to avoid wasting tokens on trivial signals.
- **Rate Limiting**: Built-in caps on the number of scans per repo and issues drafted globally.

## 📄 License

This project is licensed under the ISC License.
