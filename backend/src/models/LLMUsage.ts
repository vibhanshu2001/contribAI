import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class LLMUsage extends Model {
    public id!: number;
    public repository_id!: number;
    public tokens_in!: number;
    public tokens_out!: number;
    public estimated_cost!: number;
    public phase!: 'classification' | 'drafting';
}

LLMUsage.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    repository_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tokens_in: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    tokens_out: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    estimated_cost: {
        type: DataTypes.FLOAT, // in USD
        defaultValue: 0
    },
    phase: {
        type: DataTypes.ENUM('classification', 'drafting'),
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'LLMUsage'
});
