import { Sequelize } from 'sequelize';
import { config } from './env';

export const sequelize = new Sequelize(config.dbUrl, {
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    define: {
        timestamps: true,
        underscored: true
    }
});

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL Connected Successfully.');
        // Sync models - using alter: true for MVP to auto-migrate
        await sequelize.sync({ alter: true });
        console.log('Database Synced.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};
