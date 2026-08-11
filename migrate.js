const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const dbPath = path.resolve(__dirname, 'prisma/dev.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening SQLite DB:', err.message);
    process.exit(1);
  }
});

function fetchAll(query) {
  return new Promise((resolve, reject) => {
    db.all(query, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

const tableOrder = [
  'User', 'UserProfile', 'Client', 'Matter', 'Task', 'TaskAttachment', 'TaskLog', 
  'Reminder', 'Filing', 'FilingLog', 'Permission', 'ActivityLog', 'FiscalYear',
  'Expense', 'LedgerEntry', 'Invoice', 'Disbursement', 'IncomeRecord', 'Notification'
];

async function migrate() {
  console.log('Starting migration from dev.db to Neon Postgres...');
  try {
    for (const tableName of tableOrder) {
      console.log(`Migrating table: ${tableName}`);
      
      let rows = await fetchAll(`SELECT * FROM "${tableName}"`);
      if (rows.length === 0) {
        console.log(`- 0 rows found. Skipping.`);
        continue;
      }

      // Convert SQLite 0/1 to boolean
      const booleanFields = [
        'isRead', 'isBillable', 'isDismissed', 'isContacted', 
        'docsObtained', 'isWorking', 'isFiled', 'isBilled', 
        'isPaid', 'canWrite', 'isActive'
      ];
      
      const dateFields = [
        'createdAt', 'updatedAt', 'entryDate', 'deadline', 
        'completedAt', 'uploadedAt', 'timestamp', 'remindAt', 
        'date', 'startDate', 'endDate'
      ];

      rows = rows.map(row => {
        const newRow = { ...row };
        booleanFields.forEach(field => {
          if (newRow[field] !== undefined && newRow[field] !== null) {
            newRow[field] = newRow[field] === 1;
          }
        });
        dateFields.forEach(field => {
          if (newRow[field] !== undefined && newRow[field] !== null) {
            // SQLite might store as integer (ms) or ISO string
            newRow[field] = new Date(typeof newRow[field] === 'number' ? newRow[field] : newRow[field]);
          }
        });
        return newRow;
      });

      const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);

      try {
        await prisma[modelName].createMany({
          data: rows,
          skipDuplicates: true
        });
        console.log(`- Successfully migrated ${rows.length} rows.`);
      } catch (insertErr) {
        console.error(`- Error inserting into ${tableName}:\n`, insertErr);
        process.exit(1);
      }
    }

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

migrate();
