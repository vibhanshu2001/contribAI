import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class IssueCandidate extends Model {
    public id!: number;
    public repository_id!: number;
    public signal_id!: number;
    public title!: string;
    public body!: string;
    public category!: string;
    public confidence_score!: number;
    public status!: 'draft' | 'approved' | 'rejected' | 'published';
    public github_issue_url!: string | null;
}

IssueCandidate.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    repository_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    signal_id: {
        type: DataTypes.INTEGER,
        allowNull: true // Could be null if heuristic-only issue, but usually linked to signal
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING, // e.g., 'bug', 'docs', 'refactor'
        allowNull: false
    },
    confidence_score: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('draft', 'approved', 'rejected', 'published'),
        defaultValue: 'draft'
    },
    github_issue_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'IssueCandidate'
});
