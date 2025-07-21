-- Medication Manager Database Schema

-- Users table - synced with Cognito
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY, -- Cognito user ID (sub claim)
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  phone VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email)
);

-- Care recipients table
CREATE TABLE IF NOT EXISTS care_recipients (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  relationship VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_active (is_active)
);

-- Medication doses table - stores individual scheduled doses
CREATE TABLE IF NOT EXISTS medication_doses (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  care_recipient_id VARCHAR(255) NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(255) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (care_recipient_id) REFERENCES care_recipients(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_care_recipient_id (care_recipient_id),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_active (is_active),
  INDEX idx_completed (is_completed),
  INDEX idx_scheduled_datetime (scheduled_date, scheduled_time)
);

-- Medication templates table - for recurring medication patterns
CREATE TABLE IF NOT EXISTS medication_templates (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  care_recipient_id VARCHAR(255) NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(255) NOT NULL,
  time_of_day TIME NOT NULL,
  recurrence_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
  recurrence_days VARCHAR(20), -- For weekly: "1,3,5" (Mon,Wed,Fri), for monthly: day of month
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (care_recipient_id) REFERENCES care_recipients(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_care_recipient_id (care_recipient_id),
  INDEX idx_active (is_active)
);

-- Medication history table - for tracking changes and deletions
CREATE TABLE IF NOT EXISTS medication_history (
  id VARCHAR(255) PRIMARY KEY,
  medication_dose_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  action ENUM('created', 'updated', 'completed', 'deleted') NOT NULL,
  old_values JSON,
  new_values JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_medication_dose_id (medication_dose_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);