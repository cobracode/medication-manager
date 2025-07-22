import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getDbConnection } from '@medication-manager/core/database';
import { randomUUID } from 'crypto';

interface MedicationDose {
  id: number;
  medicationName: string;
  careRecipientId: string;
  scheduledDate: string;
  scheduledTime: string;
  dosage: string;
  isCompleted: boolean;
  isActive: boolean;
  userId: string;
  createdAt: string;
}

interface CreateMedicationRequest {
  medicationName: string;
  careRecipientId: string;
  scheduledDate: string;
  scheduledTime: string;
  dosage: string;
  recurrenceType?: 'daily' | 'weekly' | 'none';
  recurrenceEndDate?: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  };

  try {
    // Extract user ID from Cognito JWT claims
    const userId = "test-user-1"; //event.requestContext.authorizer?.claims?.sub;
    // if (!userId) {
    //   return {
    //     statusCode: 401,
    //     headers,
    //     body: JSON.stringify({ error: 'Unauthorized' }),
    //   };
    // }

    const httpMethod = event.requestContext.http.method;
    const pathParameters = event.pathParameters;
    const queryParameters = event.queryStringParameters || {};

    switch (httpMethod) {
      case 'GET':
        return await getMedications(userId, queryParameters, headers);

      case 'POST':
        const createData = JSON.parse(event.body || '{}');
        return await createMedication(userId, createData, headers);

      case 'PUT':
        if (!pathParameters?.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing medication ID' }),
          };
        }
        const updateData = JSON.parse(event.body || '{}');
        return await updateMedication(pathParameters.id, userId, updateData, headers);

      case 'PATCH':
        if (!pathParameters?.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing medication ID' }),
          };
        }
        // Handle completion toggle
        if (event.rawPath.endsWith('/complete')) {
          return await toggleCompletion(pathParameters.id, userId, headers);
        }
        // Handle marking medication inactive
        if (event.rawPath.endsWith('/inactive')) {
          const patchData = JSON.parse(event.body || '{}');
          return await markMedicationInactive(pathParameters.id, userId, patchData, headers);
        }
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid PATCH operation' }),
        };

      case 'DELETE':
        if (!pathParameters?.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing medication ID' }),
          };
        }
        return await deleteMedication(pathParameters.id, userId, headers);

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

async function getMedications(
  userId: string,
  queryParams: any,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    let query = `SELECT id, medication_name, care_recipient_id, scheduled_date, scheduled_time, 
                 dosage, is_completed, is_active, user_id, created_at 
                 FROM medication_doses 
                 WHERE user_id = ? AND is_active = true`;
    
    const queryValues: any[] = [userId];
    
    // Apply filtering if query params provided
    if (queryParams.careRecipientId) {
      query += ' AND care_recipient_id = ?';
      queryValues.push(queryParams.careRecipientId);
    }
    
    if (queryParams.dateFrom && queryParams.dateTo) {
      query += ' AND scheduled_date >= ? AND scheduled_date <= ?';
      queryValues.push(queryParams.dateFrom, queryParams.dateTo);
    }
    
    query += ' ORDER BY scheduled_date, scheduled_time';
    
    const [rows] = await connection.execute(query, queryValues);
    
    const medications = (rows as any[]).map(row => ({
      id: row.id,
      medicationName: row.medication_name,
      careRecipientId: row.care_recipient_id,
      scheduledDate: new Date(row.scheduled_date).toISOString().split('T')[0],
      scheduledTime: row.scheduled_time,
      dosage: row.dosage,
      isCompleted: row.is_completed,
      isActive: row.is_active,
      userId: row.user_id,
      createdAt: row.created_at,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(medications),
    };
  } catch (error) {
    console.error('Error getting medications:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get medications' }),
    };
  }
}

async function createMedication(
  userId: string,
  data: CreateMedicationRequest,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    // First, verify the care recipient belongs to the user
    const careRecipientCheck = await connection.execute(
      'SELECT id FROM care_recipients WHERE id = ? AND caring_user_id = ?',
      [data.careRecipientId, userId]
    );

    if ((careRecipientCheck[0] as any[]).length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid care recipient ID' }),
      };
    }
    
    const doses: MedicationDose[] = [];
    let templateId: string | null = null;
    
    // Create medication template if recurring
    if (data.recurrenceType && data.recurrenceType !== 'none' && data.recurrenceEndDate) {
      templateId = randomUUID();
      
      // Insert medication template
      await connection.execute(
        `INSERT INTO medication_templates 
         (id, user_id, care_recipient_id, medication_name, dosage, time_of_day, 
          recurrence_type, start_date, end_date, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
        [
          templateId,
          userId,
          data.careRecipientId,
          data.medicationName,
          data.dosage,
          data.scheduledTime,
          data.recurrenceType,
          data.scheduledDate,
          data.recurrenceEndDate
        ]
      );
    }
    
    // Generate dose entries
    if (data.recurrenceType === 'daily' && data.recurrenceEndDate) {
      // Generate daily doses
      const startDate = new Date(data.scheduledDate);
      const endDate = new Date(data.recurrenceEndDate);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const scheduledDate = d.toISOString().split('T')[0];
        
        const result = await connection.execute(
          `INSERT INTO medication_doses 
           (user_id, care_recipient_id, medication_name, dosage, 
            scheduled_date, scheduled_time, is_completed, is_active)
           VALUES (?, ?, ?, ?, ?, ?, false, true)`,
          [userId, data.careRecipientId, data.medicationName, data.dosage, 
           scheduledDate, data.scheduledTime]
        );

        const [rows] = await connection.execute('SELECT MAX(id) as id FROM medication_doses') as [any[], any];
        const newId = rows[0].id;

        doses.push({
          id: newId,
          medicationName: data.medicationName,
          careRecipientId: data.careRecipientId,
          scheduledDate,
          scheduledTime: data.scheduledTime,
          dosage: data.dosage,
          isCompleted: false,
          isActive: true,
          userId,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (data.recurrenceType === 'weekly' && data.recurrenceEndDate) {
      // Generate weekly doses
      const startDate = new Date(data.scheduledDate);
      const endDate = new Date(data.recurrenceEndDate);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
        const scheduledDate = d.toISOString().split('T')[0];
        
        await connection.execute(
          `INSERT INTO medication_doses 
           (user_id, care_recipient_id, medication_name, dosage, 
            scheduled_date, scheduled_time, is_completed, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, false, true, NOW(), NOW())`,
          [userId, data.careRecipientId, data.medicationName, data.dosage, 
           scheduledDate, data.scheduledTime]
        );
        const [rows] = await connection.execute('SELECT MAX(id) as id FROM medication_doses') as [any[], any];
        const newId = rows[0].id;
        doses.push({
          id: newId,
          medicationName: data.medicationName,
          careRecipientId: data.careRecipientId,
          scheduledDate,
          scheduledTime: data.scheduledTime,
          dosage: data.dosage,
          isCompleted: false,
          isActive: true,
          userId,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // Single dose
      await connection.execute(
        `INSERT INTO medication_doses 
         (user_id, care_recipient_id, medication_name, dosage, 
          scheduled_date, scheduled_time, is_completed, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, false, true, NOW(), NOW())`,
        [userId, data.careRecipientId, data.medicationName, data.dosage, 
         data.scheduledDate, data.scheduledTime]
      );
      const [rows] = await connection.execute('SELECT MAX(id) as id FROM medication_doses') as [any[], any];
      const newId = rows[0].id;
      doses.push({
        id: newId,
        medicationName: data.medicationName,
        careRecipientId: data.careRecipientId,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        dosage: data.dosage,
        isCompleted: false,
        isActive: true,
        userId,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        doses, 
        templateId,
        message: `Created ${doses.length} medication dose(s)` 
      }),
    };
  } catch (error) {
    console.error('Error creating medication:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create medication' }),
    };
  }
}

async function updateMedication(
  id: string,
  userId: string,
  data: Partial<MedicationDose>,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    // First check if the medication exists and belongs to the user
    const [checkRows] = await connection.execute(
      'SELECT id FROM medication_doses WHERE id = ? AND user_id = ? AND is_active = true',
      [id, userId]
    );
    
    if ((checkRows as any[]).length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Medication not found' }),
      };
    }
    
    // Update the medication dose
    await connection.execute(
      `UPDATE medication_doses 
       SET medication_name = ?, care_recipient_id = ?, scheduled_date = ?, 
           scheduled_time = ?, dosage = ?, is_completed = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [data.medicationName, data.careRecipientId, data.scheduledDate, 
       data.scheduledTime, data.dosage, data.isCompleted, id, userId]
    );
    
    // Fetch the updated record
    const [rows] = await connection.execute(
      `SELECT id, medication_name, care_recipient_id, scheduled_date, scheduled_time, 
       dosage, is_completed, is_active, user_id, created_at 
       FROM medication_doses WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    
    const updatedRow = (rows as any[])[0];
    const updatedDose: MedicationDose = {
      id: updatedRow.id,
      medicationName: updatedRow.medication_name,
      careRecipientId: updatedRow.care_recipient_id,
      scheduledDate: updatedRow.scheduled_date,
      scheduledTime: updatedRow.scheduled_time,
      dosage: updatedRow.dosage,
      isCompleted: updatedRow.is_completed,
      isActive: updatedRow.is_active,
      userId: updatedRow.user_id,
      createdAt: updatedRow.created_at,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedDose),
    };
  } catch (error) {
    console.error('Error updating medication:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update medication' }),
    };
  }
}

async function toggleCompletion(
  id: string,
  userId: string,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    // First get the current completion status
    const [checkRows] = await connection.execute(
      'SELECT is_completed FROM medication_doses WHERE id = ? AND user_id = ? AND is_active = true',
      [id, userId]
    );
    
    if ((checkRows as any[]).length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Medication not found' }),
      };
    }
    
    const currentStatus = (checkRows as any[])[0].is_completed;
    const newStatus = !currentStatus;
    
    // Toggle the completion status
    await connection.execute(
      'UPDATE medication_doses SET is_completed = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [newStatus, id, userId]
    );
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        id, 
        isCompleted: newStatus, 
        updatedAt: new Date().toISOString() 
      }),
    };
  } catch (error) {
    console.error('Error toggling medication completion:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to toggle medication completion' }),
    };
  }
}

async function deleteMedication(
  id: string,
  userId: string,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    // First check if the medication exists and belongs to the user
    const [checkRows] = await connection.execute(
      'SELECT id FROM medication_doses WHERE id = ? AND user_id = ? AND is_active = true',
      [id, userId]
    );
    
    if ((checkRows as any[]).length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Medication not found' }),
      };
    }
    
    // Soft delete by setting is_active = false
    await connection.execute(
      'UPDATE medication_doses SET is_active = false, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting medication:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete medication' }),
    };
  }
}

async function markMedicationInactive(
  id: string,
  userId: string,
  data: { medicationName: string; careRecipientId?: string; scope: 'single' | 'all' },
  headers: any
): Promise<APIGatewayProxyResultV2> {
  try {
    const connection = await getDbConnection();
    
    // First check if the medication exists and belongs to the user
    const [checkRows] = await connection.execute(
      'SELECT medication_name, care_recipient_id FROM medication_doses WHERE id = ? AND user_id = ? AND is_active = true',
      [id, userId]
    );
    
    if ((checkRows as any[]).length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Medication not found' }),
      };
    }
    
    const medicationRow = (checkRows as any[])[0];
    const medicationName = medicationRow.medication_name;
    const careRecipientId = medicationRow.care_recipient_id;
    
    let affectedRows = 0;
    
    if (data.scope === 'single') {
      // Mark inactive only for the specific care recipient
      const [result] = await connection.execute(
        'UPDATE medication_doses SET is_active = false, updated_at = NOW() WHERE medication_name = ? AND care_recipient_id = ? AND user_id = ? AND is_active = true',
        [medicationName, careRecipientId, userId]
      );
      affectedRows = (result as any).affectedRows;
      
      // Also mark the template inactive if it exists
      await connection.execute(
        'UPDATE medication_templates SET is_active = false, updated_at = NOW() WHERE medication_name = ? AND care_recipient_id = ? AND user_id = ? AND is_active = true',
        [medicationName, careRecipientId, userId]
      );
    } else if (data.scope === 'all') {
      // Mark inactive for all care recipients
      const [result] = await connection.execute(
        'UPDATE medication_doses SET is_active = false, updated_at = NOW() WHERE medication_name = ? AND user_id = ? AND is_active = true',
        [medicationName, userId]
      );
      affectedRows = (result as any).affectedRows;
      
      // Also mark all templates inactive for this medication
      await connection.execute(
        'UPDATE medication_templates SET is_active = false, updated_at = NOW() WHERE medication_name = ? AND user_id = ? AND is_active = true',
        [medicationName, userId]
      );
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: `Marked ${affectedRows} medication dose(s) as inactive`,
        medicationName,
        scope: data.scope,
        affectedRows
      }),
    };
  } catch (error) {
    console.error('Error marking medication inactive:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to mark medication inactive' }),
    };
  }
}