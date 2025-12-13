import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCouncilTables1702400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create council_semester_records table
    await queryRunner.createTable(
      new Table({
        name: 'council_semester_records',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'studentId',
            type: 'int',
          },
          {
            name: 'classId',
            type: 'int',
          },
          {
            name: 'term',
            type: 'int',
          },
          {
            name: 'teacherAverage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'semesterAverage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'behaviorRating',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'absencesCount',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'absencesLevel',
            type: 'enum',
            enum: ['disciplined', 'average', 'frequent'],
            isNullable: true,
          },
          {
            name: 'award',
            type: 'enum',
            enum: ['excellence', 'congratulation', 'encouragement', 'honor_roll', 'none'],
            isNullable: true,
          },
          {
            name: 'councilNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ownerId',
            type: 'int',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for council_semester_records
    await queryRunner.createForeignKey(
      'council_semester_records',
      new TableForeignKey({
        columnNames: ['studentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'students',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'council_semester_records',
      new TableForeignKey({
        columnNames: ['classId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'classes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'council_semester_records',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create final_council_decisions table
    await queryRunner.createTable(
      new Table({
        name: 'final_council_decisions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'studentId',
            type: 'int',
          },
          {
            name: 'classId',
            type: 'int',
          },
          {
            name: 'term1Average',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'term2Average',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'term3Average',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'annualAverage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'finalDecision',
            type: 'enum',
            enum: ['pass', 'repeat', 'remedial', 'redirect', 'vocational_redirect'],
            isNullable: true,
          },
          {
            name: 'isManualDecision',
            type: 'boolean',
            default: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ownerId',
            type: 'int',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for final_council_decisions
    await queryRunner.createForeignKey(
      'final_council_decisions',
      new TableForeignKey({
        columnNames: ['studentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'students',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'final_council_decisions',
      new TableForeignKey({
        columnNames: ['classId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'classes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'final_council_decisions',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('final_council_decisions');
    await queryRunner.dropTable('council_semester_records');
  }
}


