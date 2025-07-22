import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { Resource } from 'sst';
import { getDbConnection } from '@medication-manager/core/database/connection';
import { randomUUID } from 'crypto';

interface MedicationDose {
  id: string;
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
  // TODO: Replace with actual database query
  // Support filtering by date range, care recipient, etc.
  
  const mockDoses: MedicationDose[] = [
    {
      id: '1',
      medicationName: 'Blood Pressure Pills',
      careRecipientId: '1',
      scheduledDate: '2024-01-15',
      scheduledTime: '09:00',
      dosage: '1 pill',
      isCompleted: false,
      isActive: true,
      userId,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      medicationName: 'Vitamin D',
      careRecipientId: '1',
      scheduledDate: '2024-01-15',
      scheduledTime: '18:00',
      dosage: '2 pills',
      isCompleted: true,
      isActive: true,
      userId,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  // Apply basic filtering if query params provided
  let filteredDoses = mockDoses;
  if (queryParams.careRecipientId) {
    filteredDoses = filteredDoses.filter(d => d.careRecipientId === queryParams.careRecipientId);
  }
  if (queryParams.dateFrom && queryParams.dateTo) {
    filteredDoses = filteredDoses.filter(d => 
      d.scheduledDate >= queryParams.dateFrom && d.scheduledDate <= queryParams.dateTo
    );
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(filteredDoses),
  };
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
      'SELECT id FROM care_recipients WHERE id = ? AND user_id = ? AND is_active = true',
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
        const doseId = randomUUID();
        const scheduledDate = d.toISOString().split('T')[0];
        
        await connection.execute(
          `INSERT INTO medication_doses 
           (id, user_id, care_recipient_id, medication_name, dosage, 
            scheduled_date, scheduled_time, is_completed, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, false, true, NOW(), NOW())`,
          [doseId, userId, data.careRecipientId, data.medicationName, data.dosage, 
           scheduledDate, data.scheduledTime]
        );
        
        doses.push({
          id: doseId,
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
        const doseId = randomUUID();
        const scheduledDate = d.toISOString().split('T')[0];
        
        await connection.execute(
          `INSERT INTO medication_doses 
           (id, user_id, care_recipient_id, medication_name, dosage, 
            scheduled_date, scheduled_time, is_completed, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, false, true, NOW(), NOW())`,
          [doseId, userId, data.careRecipientId, data.medicationName, data.dosage, 
           scheduledDate, data.scheduledTime]
        );
        
        doses.push({
          id: doseId,
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
      const doseId = randomUUID();
      
      await connection.execute(
        `INSERT INTO medication_doses 
         (id, user_id, care_recipient_id, medication_name, dosage, 
          scheduled_date, scheduled_time, is_completed, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, false, true, NOW(), NOW())`,
        [doseId, userId, data.careRecipientId, data.medicationName, data.dosage, 
         data.scheduledDate, data.scheduledTime]
      );
      
      doses.push({
        id: doseId,
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
  // TODO: Replace with actual database update
  const updatedDose: MedicationDose = {
    id,
    medicationName: data.medicationName || 'Updated Medication',
    careRecipientId: data.careRecipientId || '1',
    scheduledDate: data.scheduledDate || '2024-01-01',
    scheduledTime: data.scheduledTime || '09:00',
    dosage: data.dosage || '1 pill',
    isCompleted: data.isCompleted ?? false,
    isActive: data.isActive ?? true,
    userId,
    createdAt: '2024-01-01T00:00:00Z',
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(updatedDose),
  };
}

async function toggleCompletion(
  id: string,
  userId: string,
  headers: any
): Promise<APIGatewayProxyResultV2> {
  // TODO: Replace with actual database update to toggle isCompleted
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ id, isCompleted: true, updatedAt: new Date().toISOString() }),
  };
}

async function deleteMedication(
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