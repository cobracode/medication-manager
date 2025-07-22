import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Resource } from 'sst';
import { getDbConnection } from '@medication-manager/core/database';

interface CareRecipient {
  id: number;
  name: string;
  age: number;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    // Extract user ID from Cognito JWT claims
    const userId = "1234"; //event.requestContext.authorizer?.claims?.sub;
    // if (!userId) {
    //   return {
    //     statusCode: 401,
    //     headers,
    //     body: JSON.stringify({ error: 'Unauthorized' }),
    //   };
    // }

    const httpMethod = event.requestContext.http.method;
    const pathParameters = event.pathParameters;

    switch (httpMethod) {
      case 'GET':
        return await getCareRecipients(userId, headers);

      case 'POST':
        const createData = JSON.parse(event.body || '{}');
        return await createCareRecipient(userId, createData, headers);

      case 'PUT':
        if (!pathParameters?.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing care recipient ID' }),
          };
        }
        const updateData = JSON.parse(event.body || '{}');
        return await updateCareRecipient(pathParameters.id, userId, updateData, headers);

      case 'DELETE':
        if (!pathParameters?.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing care recipient ID' }),
          };
        }
        return await deleteCareRecipient(pathParameters.id, userId, headers);

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export async function getCareRecipients(_userId: string, headers: any): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    const [rows] = await connection.execute(
      'SELECT id, name, age FROM care_recipients',
      []
    );
    
    const recipients = (rows as any[]).map(row => ({
      id: row.id,
      name: row.name,
      age: row.age,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(recipients),
    };
  } catch (error) {
    console.error('Error getting care recipients:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get care recipients' }),
    };
  }
}

async function createCareRecipient(
  _userId: string,
  data: Partial<CareRecipient>,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    const [result] = await connection.execute(
      `INSERT INTO care_recipients (name, age) VALUES (?, ?)`,
      [data.name, data.age]
    );

    const insertResult = result as any;
    const newRecipient: CareRecipient = {
      id: insertResult.insertId,
      name: data.name || '',
      age: data.age || 0,
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newRecipient),
    };
  } catch (error) {
    console.error('Error creating care recipient:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create care recipient' }),
    };
  }
}

async function updateCareRecipient(
  id: string,
  _userId: string,
  data: Partial<CareRecipient>,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    // First check if the care recipient exists
    const [checkRows] = await connection.execute(
      'SELECT id FROM care_recipients WHERE id = ?',
      [id]
    );
    
    if ((checkRows as any[]).length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Care recipient not found' }),
      };
    }
    
    // Update the care recipient
    await connection.execute(
      `UPDATE care_recipients SET name = ?, age = ? WHERE id = ?`,
      [data.name, data.age, id]
    );
    
    // Fetch the updated record
    const [rows] = await connection.execute(
      'SELECT id, name, age FROM care_recipients WHERE id = ?',
      [id]
    );
    
    const updatedRow = (rows as any[])[0];
    const updatedRecipient: CareRecipient = {
      id: updatedRow.id,
      name: updatedRow.name,
      age: updatedRow.age,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedRecipient),
    };
  } catch (error) {
    console.error('Error updating care recipient:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update care recipient' }),
    };
  }
}

async function deleteCareRecipient(
  id: string,
  _userId: string,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    // First check if the care recipient exists
    const [checkRows] = await connection.execute(
      'SELECT id FROM care_recipients WHERE id = ?',
      [id]
    );
    
    if ((checkRows as any[]).length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Care recipient not found' }),
      };
    }
    
    // Hard delete from the table
    await connection.execute(
      'DELETE FROM care_recipients WHERE id = ?',
      [id]
    );
    
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting care recipient:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete care recipient' }),
    };
  }
}