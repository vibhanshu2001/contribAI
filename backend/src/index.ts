import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env';
import { connectDB } from './config/database';
import { authRoutes } from './routes/auth';
import { repoRoutes } from './routes/repos';
import { issueRoutes } from './routes/issues';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/issues', issueRoutes);

// Start server
const start = async () => {
    await connectDB();
    app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
};

start().catch(err => {
    console.error('Failed to start server:', err);
});
