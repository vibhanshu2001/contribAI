import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Repository extends Model {
    public id!: number;
    public owner!: string;
    public name!: string;
    public stars!: number;
    public language!: string;
    public last_scan_at!: Date | null;
    public scan_status!: 'queued' | 'scanning' | 'completed' | 'failed' | 'idle';
    public scan_cursor!: string | null;
    public ignored_paths!: string;
}

Repository.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    owner: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    stars: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    language: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_scan_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    scan_status: {
        type: DataTypes.ENUM('queued', 'scanning', 'completed', 'failed', 'idle'),
        defaultValue: 'idle'
    },
    scan_cursor: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Persistent cursor for resuming interrupted scans'
    },
    ignored_paths: {
        type: DataTypes.TEXT,
        defaultValue: '["node_modules","dist","build",".git","vendor","coverage"]',
        comment: 'JSON array of paths to ignore during scanning'
    }
}, {
    sequelize,
    modelName: 'Repository',
    indexes: [
        { unique: true, fields: ['owner', 'name'] }
    ]
});
