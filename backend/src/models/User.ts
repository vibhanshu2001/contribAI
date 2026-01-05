import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
    public id!: number;
    public github_username!: string;
    public github_id!: string;
    public oauth_token_encrypted!: string;
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    github_username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    github_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    oauth_token_encrypted: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'User'
});
