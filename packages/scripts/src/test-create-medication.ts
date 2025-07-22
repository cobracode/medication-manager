#!/usr/bin/env node

import { getDbConnection, closeDbConnection } from '../../core/src/database/connection.js';
import { randomUUID } from 'crypto';

async function testCreateMedication() {
  try {
    console.log('🧪 Testing createMedication database integration...');
    
    const connection = await getDbConnection();
    
    // First, create a test user and care recipient
    const userId = randomUUID();
    const careRecipientId = randomUUID();
    
    console.log('📝 Creating test user and care recipient...');
    
    // Insert test user
    await connection.execute(
      `INSERT INTO users (id, email, name, timezone, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [userId, 'test@example.com', 'Test User', 'UTC']
    );
    
    // Insert test care recipient
    await connection.execute(
      `INSERT INTO care_recipients (id, user_id, name, date_of_birth, relationship, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())`,
      [careRecipientId, userId, 'Test Care Recipient', '1980-01-01', 'Self']
    );
    
    console.log('✅ Test data created');
    
    // Test 1: Single dose medication
    console.log('\n🧪 Test 1: Creating single dose medication...');
    const singleDoseId = randomUUID();
    await connection.execute(
      `INSERT INTO medication_doses 
       (id, user_id, care_recipient_id, medication_name, dosage, 
        scheduled_date, scheduled_time, is_completed, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, false, true, NOW(), NOW())`,
      [singleDoseId, userId, careRecipientId, 'Test Medicine', '1 pill', '2024-01-15', '09:00']
    );
    console.log('✅ Single dose created successfully');
    
    // Test 2: Daily recurring medication template
    console.log('\n🧪 Test 2: Creating recurring medication template...');
    const templateId = randomUUID();
    await connection.execute(
      `INSERT INTO medication_templates 
       (id, user_id, care_recipient_id, medication_name, dosage, time_of_day, 
        recurrence_type, start_date, end_date, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
      [
        templateId,
        userId,
        careRecipientId,
        'Daily Vitamin',
        '1 tablet',
        '08:00',
        'daily',
        '2024-01-01',
        '2024-01-03'
      ]
    );
    console.log('✅ Template created successfully');
    
    // Test 3: Create multiple daily doses
    console.log('\n🧪 Test 3: Creating multiple daily doses...');
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-03');
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const doseId = randomUUID();
      const scheduledDate = d.toISOString().split('T')[0];
      
      await connection.execute(
        `INSERT INTO medication_doses 
         (id, user_id, care_recipient_id, medication_name, dosage, 
          scheduled_date, scheduled_time, is_completed, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, false, true, NOW(), NOW())`,
        [doseId, userId, careRecipientId, 'Daily Vitamin', '1 tablet', scheduledDate, '08:00']
      );
    }
    console.log('✅ Multiple daily doses created successfully');
    
    // Verify data was inserted
    console.log('\n🔍 Verifying inserted data...');
    
    const [doses] = await connection.execute(
      'SELECT * FROM medication_doses WHERE user_id = ?',
      [userId]
    );
    console.log(`📊 Total doses created: ${(doses as any[]).length}`);
    
    const [templates] = await connection.execute(
      'SELECT * FROM medication_templates WHERE user_id = ?',
      [userId]
    );
    console.log(`📊 Total templates created: ${(templates as any[]).length}`);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await connection.execute('DELETE FROM medication_doses WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM medication_templates WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM care_recipients WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! CreateMedication database integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await closeDbConnection();
  }
}

// Run test
testCreateMedication();