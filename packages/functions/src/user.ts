import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getDbConnection } from '@medication-manager/core/database';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
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
    const jwtClaims = (event.requestContext as any).authorizer?.jwt?.claims;

    const userId = jwtClaims?.sub;
    const email = jwtClaims?.email;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const httpMethod = event.requestContext.http.method;

    switch (httpMethod) {
      case 'GET':
        return await getUserProfile(userId, headers, email);

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
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    // Try to get existing user
    const [rows] = await connection.execute(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    const users = rows as any[];
    
    if (users.length === 0) {
      // User doesn't exist - create new user with Cognito data
      await connection.execute(
        'INSERT INTO users (id, email) VALUES (?, ?)',
        [userId, email || 'unknown@email.com']
      );
      
      // Fetch the newly created user
      const [newRows] = await connection.execute(
        'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );
      const newUser = (newRows as any[])[0];
      
      const userProfile: UserProfile = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at,
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userProfile),
      };
    }

    // User exists - return profile
    const user = users[0];
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(userProfile),
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user profile' }),
    };
  }
}

async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    // First check if user exists
    const [checkRows] = await connection.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if ((checkRows as any[]).length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
    
    // Update user profile (exclude email and id from updates)
    const updateFields = [];
    const updateValues = [];
    
    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);
    
    if (updateFields.length > 1) { // More than just updated_at
      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }
    
    // Fetch updated user profile
    const [rows] = await connection.execute(
      'SELECT id, email, name, phone, timezone, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    const user = (rows as any[])[0];
    const updatedProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedProfile),
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update user profile' }),
    };
  }
}