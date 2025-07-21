import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Resource } from 'sst';

interface CareRecipient {
  id: string;
  name: string;
  dateOfBirth: string;
  relationship: string;
  isActive: boolean;
  userId: string;
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

export async function getCareRecipients(userId: string, headers: any): Promise<APIGatewayProxyResultV2> {
  // TODO: Replace with actual database query
  const mockRecipients: CareRecipient[] = [
    {
      id: '1',
      name: 'Mom',
      dateOfBirth: '1960-05-15',
      relationship: 'Mother',
      isActive: true,
      userId,
    },
    {
      id: '2', 
      name: 'Dad',
      dateOfBirth: '1958-12-03',
      relationship: 'Father',
      isActive: true,
      userId,
    },
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(mockRecipients),
  };
}

async function createCareRecipient(
  userId: string,
  data: Partial<CareRecipient>,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  // TODO: Replace with actual database insert
  const newRecipient: CareRecipient = {
    id: Date.now().toString(),
    name: data.name || '',
    dateOfBirth: data.dateOfBirth || '',
    relationship: data.relationship || '',
    isActive: true,
    userId,
  };

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify(newRecipient),
  };
}

async function updateCareRecipient(
  id: string,
  userId: string,
  data: Partial<CareRecipient>,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  // TODO: Replace with actual database update
  const updatedRecipient: CareRecipient = {
    id,
    name: data.name || 'Updated Name',
    dateOfBirth: data.dateOfBirth || '1960-01-01',
    relationship: data.relationship || 'Updated Relationship',
    isActive: data.isActive ?? true,
    userId,
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(updatedRecipient),
  };
}

async function deleteCareRecipient(
  id: string,
  userId: string,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  // TODO: Replace with actual database soft delete (set isActive = false)
  
  return {
    statusCode: 204,
    headers,
    body: '',
  };
}