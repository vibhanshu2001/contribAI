import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface ScanCursor {
    lastProcessedFile: string;
    filesProcessed: number;
    totalFiles: number;
    phase: 'tree' | 'files' | 'signals' | 'llm';
    timestamp: string;
}

export interface ProgressEvent {
    timestamp: string;
    phase: string;
    message: string;
    filesProcessed?: number;
    totalFiles?: number;
    currentFile?: string;
}

export class ScanJob extends Model {
    public id!: number;
    public repository_id!: number;
    public status!: 'pending' | 'active' | 'completed' | 'failed';
    public started_at!: Date;
    public completed_at!: Date | null;
    public signals_found!: number;
    public scan_cursor!: string | null;
    public progress_percentage!: number;
    public current_phase!: string;
    public progress_log!: string;
}

ScanJob.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    repository_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'active', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    signals_found: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    scan_cursor: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON string containing cursor position for resumable scans'
    },
    progress_percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    current_phase: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
        comment: 'Current phase: fetching_tree, scanning_files, processing_signals, completed'
    },
    progress_log: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        comment: 'JSON array of progress events'
    }
}, {
    sequelize,
    modelName: 'ScanJob'
});
