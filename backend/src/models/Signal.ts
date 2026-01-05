import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Signal extends Model {
    public id!: number;
    public repository_id!: number;
    public type!: string;
    public file_path!: string;
    public line_number!: number;
    public snippet!: string;
    public context!: string; // Minimal surrounding code
}

Signal.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    repository_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING, // e.g., 'TODO', 'MISSING_DOCS'
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    line_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    snippet: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    context: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Signal'
});
