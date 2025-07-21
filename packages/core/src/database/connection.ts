import mysql from 'mysql2/promise';
import { Resource } from 'sst';

// Database connection singleton
let connection: mysql.Connection | null = null;

export async function getDbConnection(): Promise<mysql.Connection> {
  if (!connection) {
    // In SST, the MySQL resource provides connection details
    // For development, use hardcoded values from db.ts
    const isDev = process.env.SST_STAGE === 'dev' || !process.env.SST_STAGE;
    
    if (isDev) {
      connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'password',
        database: 'local',
        ssl: false,
      });
    } else {
      // Production/staging - use SST Resource
      // Note: This will need to be updated based on actual SST MySQL resource structure
      connection = await mysql.createConnection({
        host: Resource.MySql.host,
        port: Resource.MySql.port || 3306,
        user: Resource.MySql.username,
        password: Resource.MySql.password,
        database: Resource.MySql.database,
        ssl: {
          rejectUnauthorized: false
        }
      });
    }
  }
  
  return connection;
}

export async function closeDbConnection(): Promise<void> {
  if (connection) {
    await connection.end();
    connection = null;
  }
}

// Execute a query with error handling
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> {
  const conn = await getDbConnection();
  
  try {
    const [rows] = await conn.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Execute a query and return the first result
export async function executeQueryOne<T = any>(
  query: string, 
  params: any[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results.length > 0 ? results[0] : null;
}

// Execute an insert and return the inserted ID
export async function executeInsert(
  query: string, 
  params: any[] = []
): Promise<string> {
  const conn = await getDbConnection();
  
  try {
    const [result] = await conn.execute(query, params) as any[];
    return result.insertId?.toString() || '';
  } catch (error) {
    console.error('Database insert error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}