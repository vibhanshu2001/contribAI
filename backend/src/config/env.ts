import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    dbUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/issue_tracker',
    github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/callback'
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || ''
    },
    limits: {
        maxIssuesPerScan: 3,
        maxScansPerDay: 1
    }
};
