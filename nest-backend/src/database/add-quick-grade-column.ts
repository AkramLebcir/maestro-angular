import { DataSource } from 'typeorm';

/**
 * Migration script to add quickGrade column to seat_assignments table
 * Run this script once to add the new column to the database
 * 
 * Usage:
 * 1. Ensure your database connection is configured
 * 2. Run: npx ts-node src/database/add-quick-grade-column.ts
 */

async function addQuickGradeColumn() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ala_project',
  });

  try {
    await dataSource.initialize();
    console.log('✓ Connected to database');

    // Check if column already exists
    const queryRunner = dataSource.createQueryRunner();
    const table = await queryRunner.getTable('seat_assignments');
    
    if (!table) {
      console.error('✗ Table seat_assignments not found');
      await dataSource.destroy();
      return;
    }

    const columnExists = table.columns.find(col => col.name === 'quickGrade');
    
    if (columnExists) {
      console.log('✓ Column quickGrade already exists, skipping migration');
    } else {
      console.log('→ Adding quickGrade column...');
      
      await queryRunner.query(`
        ALTER TABLE seat_assignments 
        ADD COLUMN quickGrade FLOAT NULL
        COMMENT 'Quick grade for the student (0-20)'
      `);
      
      console.log('✓ Column quickGrade added successfully');
    }

    await queryRunner.release();
    await dataSource.destroy();
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addQuickGradeColumn();
}

export { addQuickGradeColumn };





