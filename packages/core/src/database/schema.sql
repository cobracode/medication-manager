-- Medication Manager Database Schema

-- Users table - synced with Cognito
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY NOT NULL UNIQUE, -- Cognito user ID (sub claim)
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
);

INSERT IGNORE INTO users (
	id, email, `name`
) VALUES (
	'test-user-1', 'test-ned-email1@test.com', 'Ned1'
), (
	'test-user-2', 'test-ned-email2@test.com', 'Ned2'
);

-- Care recipients table
CREATE TABLE IF NOT EXISTS care_recipients (
  id INT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  caring_user_id VARCHAR(255) NOT NULL,
  age INT UNSIGNED NOT NULL DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (caring_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_user_id (caring_user_id)
);

INSERT IGNORE INTO care_recipients (
	`name`, age, caring_user_id
) VALUES (
	'Sarah', 58, 'test-user-1'
), (
	'Bob', 99, 'test-user-1'
), (
	'Joe', 77, 'test-user-1'
);

-- Medication doses table - stores individual scheduled doses
CREATE TABLE IF NOT EXISTS medication_doses (
  id INT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  care_recipient_id INT UNSIGNED NOT NULL,
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
  care_recipient_id INT UNSIGNED NOT NULL,
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