import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Resource } from 'sst';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  };

  try {
    // Extract user information from Cognito JWT claims
    const userId = "1234";//event.requestContext.authorizer?.claims?.sub;
    const email = "ned.renovate009@passfwd.com";//event.requestContext.authorizer?.claims?.email;
    const name = "Nedster";// event.requestContext.authorizer?.claims?.name;
    
    // if (!userId) {
    //   return {
    //     statusCode: 401,
    //     headers,
    //     body: JSON.stringify({ error: 'Unauthorized' }),
    //   };
    // }

    const httpMethod = event.requestContext.http.method;

    switch (httpMethod) {
      case 'GET':
        return await getUserProfile(userId, email, name, headers);

      case 'PUT':
        const updateData = JSON.parse(event.body || '{}');
        return await updateUserProfile(userId, updateData, headers);

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

async function getUserProfile(
  userId: string,
  headers: any,
  email?: string,
  name?: string,
): Promise<APIGatewayProxyResultV2> {
  // TODO: Replace with actual database query
  // For now, return profile based on Cognito claims with mock data
  
  const userProfile: UserProfile = {
    id: userId,
    email: email || 'user@example.com',
    name: name || 'User Name',
    phone: '+1-555-0123', // Mock data
    timezone: 'America/Los_Angeles', // Mock data
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(userProfile),
  };
}

async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  // TODO: Replace with actual database update
  // Note: Some fields like email should typically be managed by Cognito directly
  
  const updatedProfile: UserProfile = {
    id: userId,
    email: 'user@example.com', // Keep existing email (managed by Cognito)
    name: data.name || 'Updated Name',
    phone: data.phone || '+1-555-0123',
    timezone: data.timezone || 'America/Los_Angeles',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(updatedProfile),
  };
}