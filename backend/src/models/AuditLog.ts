import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class AuditLog extends Model {
    public id!: number;
    public user_id!: number;
    public action!: string;
    public EntityType!: string;
    public EntityId!: number;
    public metadata!: object;
}

AuditLog.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    EntityType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    EntityId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'AuditLog'
});
