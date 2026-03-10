create database pulseiq;
use pulseiq;
show tables;

select * from projects;

-- Create database
CREATE DATABASE IF NOT EXISTS pulseiq;
USE pulseiq;
SELECT p.*, 
       CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(ts.technology)), ']') as techStack
FROM projects p
LEFT JOIN tech_stack ts ON p.id = ts.projectId
GROUP BY p.id
ORDER BY p.createdDate DESC;


     SELECT p.*, 
               CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(ts.technology)), ']') as techStack
        FROM projects p
        LEFT JOIN tech_stack ts ON p.id = ts.projectId
        WHERE p.id = 1
        GROUP BY p.id;

        SELECT p.*, 
               CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(ts.technology)), ']') as techStack
        FROM projects p
        LEFT JOIN tech_stack ts ON p.id = ts.projectId
        WHERE p.id = ?
        GROUP BY p.id
        ORDER BY p.createdDate DESC;

show tables;

select * from goals;
select * from commits_by_day;
-- =====================================================
-- 1. PROJECTS TABLE
-- =====================================================

ALTER TABLE projects
MODIFY COLUMN category ENUM(
    'E-Commerce',
    'SaaS Tool',
    'DevOps',
    'Mobile App',
    'API Service',
    'Data Pipeline',
    'ML/AI',
    'Open Source',
    'LIMS Development'
) NOT NULL;
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('E-Commerce', 'SaaS Tool', 'DevOps', 'Mobile App', 'API Service', 'Data Pipeline', 'ML/AI', 'Open Source') NOT NULL,
    color VARCHAR(7) NOT NULL,
    totalTasks INT DEFAULT 0,
    completedTasks INT DEFAULT 0,
    features INT DEFAULT 0,
    bugsFixed INT DEFAULT 0,
    refactors INT DEFAULT 0,
    totalHours DECIMAL(10,2) DEFAULT 0,
    activeDays INT DEFAULT 0,
    lastActive TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    commits INT DEFAULT 0,
    learningPoints INT DEFAULT 0,
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_created (createdDate)
);

ALTER TABLE projects
ADD COLUMN git_repo VARCHAR(255) NULL AFTER name;

-- =====================================================
-- 2. TECH STACK TABLE (Many-to-Many with projects)
-- =====================================================
CREATE TABLE tech_stack (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    technology VARCHAR(50) NOT NULL,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project (projectId)
);

-- =====================================================
-- 3. WEEKLY HOURS TABLE
-- =====================================================
CREATE TABLE weekly_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    monday DECIMAL(5,2) DEFAULT 0,
    tuesday DECIMAL(5,2) DEFAULT 0,
    wednesday DECIMAL(5,2) DEFAULT 0,
    thursday DECIMAL(5,2) DEFAULT 0,
    friday DECIMAL(5,2) DEFAULT 0,
    saturday DECIMAL(5,2) DEFAULT 0,
    sunday DECIMAL(5,2) DEFAULT 0,
    weekStartDate DATE NOT NULL,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_week (projectId, weekStartDate)
);

-- -------------------------------------------------
			-- task table
-- ------------------------------------------------
ALTER TABLE tasks

ADD COLUMN description TEXT AFTER title,

ADD COLUMN type ENUM('feature','bug','improvement','research') AFTER description,

ADD COLUMN priority ENUM('low','medium','high','critical') AFTER status,

ADD COLUMN storyPoints INT AFTER priority,
ADD COLUMN complexityScore INT AFTER storyPoints,

ADD COLUMN createdBy INT AFTER complexityScore,
ADD COLUMN assignedTo INT AFTER createdBy,
ADD COLUMN reviewerId INT AFTER assignedTo,

ADD COLUMN sprintId INT AFTER reviewerId,
ADD COLUMN milestoneId INT AFTER sprintId,

ADD COLUMN estimatedHours FLOAT AFTER milestoneId,
ADD COLUMN actualHours FLOAT AFTER estimatedHours,

ADD COLUMN commitCount INT DEFAULT 0 AFTER actualHours,
ADD COLUMN linesAdded INT DEFAULT 0 AFTER commitCount,
ADD COLUMN linesRemoved INT DEFAULT 0 AFTER linesAdded,
ADD COLUMN filesChanged INT DEFAULT 0 AFTER linesRemoved,

ADD COLUMN branchName VARCHAR(255) AFTER filesChanged,
ADD COLUMN pullRequestId VARCHAR(255) AFTER branchName,

ADD COLUMN riskLevel ENUM('low','medium','high') AFTER pullRequestId,
ADD COLUMN impactLevel ENUM('low','medium','high') AFTER riskLevel,

ADD COLUMN dateUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER dateCreated,

ADD COLUMN startDate DATETIME AFTER dateUpdated,
ADD COLUMN dueDate DATETIME AFTER startDate,
ADD COLUMN completedAt DATETIME AFTER dueDate;

-- =====================================================
-- 4. MONTHLY HOURS TABLE (Daily tracking for last 15 days)
-- =====================================================
CREATE TABLE daily_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(5,2) DEFAULT 0,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_date (projectId, date),
    UNIQUE KEY unique_project_date (projectId, date)
);

-- =====================================================
-- 5. GIT METRICS TABLE
-- =====================================================
CREATE TABLE git_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    pullRequests INT DEFAULT 0,
    mergedPRs INT DEFAULT 0,
    codeReviews INT DEFAULT 0,
    languages JSON, -- Store as JSON: {"JavaScript": 45, "TypeScript": 30}
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project (projectId)
);

-- =====================================================
-- 6. COMMIT MESSAGES TABLE
-- =====================================================
CREATE TABLE commit_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    message TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_created (projectId, createdAt)
);

-- =====================================================
-- 7. COMMIT TREND TABLE (Daily commits for last 15 days)
-- =====================================================
CREATE TABLE commit_trend (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    date DATE NOT NULL,
    commitCount INT DEFAULT 0,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_date (projectId, date),
    UNIQUE KEY unique_project_date (projectId, date)
);

-- =====================================================
-- 8. COMMITS BY DAY TABLE (Weekly pattern)
-- =====================================================
CREATE TABLE commits_by_day (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    monday INT DEFAULT 0,
    tuesday INT DEFAULT 0,
    wednesday INT DEFAULT 0,
    thursday INT DEFAULT 0,
    friday INT DEFAULT 0,
    saturday INT DEFAULT 0,
    sunday INT DEFAULT 0,
    weekStartDate DATE NOT NULL,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_week (projectId, weekStartDate)
);

-- =====================================================
-- 9. LEARNING ENTRIES TABLE
-- =====================================================
CREATE TABLE learning_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    concept VARCHAR(200) NOT NULL,
    category ENUM('Backend', 'Frontend', 'DevOps', 'Architecture', 'Business') NOT NULL,
    difficulty TINYINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    type ENUM('New concept', 'Mistake learned', 'Deepened knowledge', 'Optimization') NOT NULL,
    confidence ENUM('Low', 'Medium', 'High') NOT NULL,
    dateLogged DATE NOT NULL,
    timeSpent DECIMAL(5,2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_date (projectId, dateLogged)
);

-- =====================================================
-- 10. LEARNING RESOURCES TABLE
-- =====================================================
CREATE TABLE learning_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    learningEntryId INT NOT NULL,
    resource VARCHAR(255) NOT NULL,
    FOREIGN KEY (learningEntryId) REFERENCES learning_entries(id) ON DELETE CASCADE,
    INDEX idx_entry (learningEntryId)
);
SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday, weekStartDate FROM weekly_hours WHERE projectId = 2 ORDER BY weekStartDate DESC LIMIT 1;
-- =====================================================
-- 11. DAILY REPORTS TABLE
-- =====================================================
CREATE TABLE daily_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    date DATE NOT NULL,
    hoursWorked DECIMAL(4,2) NOT NULL CHECK (hoursWorked BETWEEN 0 AND 24),
    tasksDone INT NOT NULL DEFAULT 0,
    notes TEXT,
    mood ENUM('productive', 'focused', 'tired', 'distracted', 'stressed') NOT NULL,
    focusScore TINYINT NOT NULL CHECK (focusScore BETWEEN 1 AND 10),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_date (projectId, date),
    UNIQUE KEY unique_project_date (projectId, date)
);

-- =====================================================
-- 12. DOCUMENTATION TABLE
-- =====================================================
CREATE TABLE documentation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('draft', 'in-progress', 'complete') NOT NULL DEFAULT 'draft',
    date DATE NOT NULL,
    sections INT GENERATED ALWAYS AS (
        LENGTH(content) - LENGTH(REPLACE(content, '\n\n', '')) + 1
    ) STORED,
    wordCount INT GENERATED ALWAYS AS (
        LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1
    ) STORED,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_date (projectId, date)
);

-- =====================================================
-- 13. GOALS TABLE
-- =====================================================
CREATE TABLE goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    target DECIMAL(10,2) NOT NULL CHECK (target > 0),
    current DECIMAL(10,2) NOT NULL DEFAULT 0,
    category ENUM('Learning', 'Quality', 'Delivery', 'Performance', 'DevOps') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_category (projectId, category)
);

-- =====================================================
-- 14. SYNC STATUS TABLE (For offline sync tracking)
-- =====================================================
CREATE TABLE issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'in-progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_status (projectId, status),
    INDEX idx_project_created (projectId, dateCreated)
);

ALTER TABLE issues ADD COLUMN githubNumber INT NULL;
ALTER TABLE issues ADD COLUMN timeSpent DECIMAL(10,2) DEFAULT 0;



ALTER TABLE goals 
ADD COLUMN comments TEXT,
ADD COLUMN status ENUM('todo', 'in-progress', 'completed') DEFAULT 'todo',
ADD COLUMN hoursSpent DECIMAL(10,2) DEFAULT 0,
ADD COLUMN issueIds JSON,
ADD COLUMN reportIds JSON,
ADD COLUMN taskIds JSON;

-- =====================================================
-- 15. SYNC STATUS TABLE (For offline sync tracking)
-- =====================================================
CREATE TABLE sync_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entityType ENUM('project', 'learning', 'report', 'doc', 'goal', 'issue') NOT NULL,
    entityId INT,
    operation ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    payload JSON NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    retryCount INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created (createdAt)
);


DELIMITER $$

CREATE TRIGGER trg_update_weekly_hours
AFTER INSERT ON daily_reports
FOR EACH ROW
BEGIN

DECLARE week_start DATE;
DECLARE day_name VARCHAR(10);

-- Calculate Monday of the week
SET week_start = DATE_SUB(NEW.date, INTERVAL WEEKDAY(NEW.date) DAY);

-- Determine day name
SET day_name = DAYNAME(NEW.date);

-- Ensure weekly row exists
INSERT INTO weekly_hours (projectId, weekStartDate)
VALUES (NEW.projectId, week_start)
ON DUPLICATE KEY UPDATE projectId = projectId;

-- Update correct day column
IF day_name = 'Monday' THEN
    UPDATE weekly_hours 
    SET monday = monday + NEW.hoursWorked
    WHERE projectId = NEW.projectId AND weekStartDate = week_start;

ELSEIF day_name = 'Tuesday' THEN
    UPDATE weekly_hours 
    SET tuesday = tuesday + NEW.hoursWorked
    WHERE projectId = NEW.projectId AND weekStartDate = week_start;

ELSEIF day_name = 'Wednesday' THEN
    UPDATE weekly_hours 
    SET wednesday = wednesday + NEW.hoursWorked
    WHERE projectId = NEW.projectId AND weekStartDate = week_start;

ELSEIF day_name = 'Thursday' THEN
    UPDATE weekly_hours 
    SET thursday = thursday + NEW.hoursWorked
    WHERE projectId = NEW.projectId AND weekStartDate = week_start;

ELSEIF day_name = 'Friday' THEN
    UPDATE weekly_hours 
    SET friday = friday + NEW.hoursWorked
    WHERE projectId = NEW.projectId AND weekStartDate = week_start;

ELSEIF day_name = 'Saturday' THEN
    UPDATE weekly_hours 
    SET saturday = saturday + NEW.hoursWorked
    WHERE projectId = NEW.projectId AND weekStartDate = week_start;

ELSEIF day_name = 'Sunday' THEN
    UPDATE weekly_hours 
    SET sunday = sunday + NEW.hoursWorked
    WHERE projectId = NEW.projectId AND weekStartDate = week_start;
END IF;

END$$

DELIMITER ;

-- =====================================================
-- 15. ISSUES TABLE
-- =====================================================
CREATE TABLE issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('open', 'in-progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_status (projectId, status)
);



CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    status ENUM('todo', 'in-progress', 'completed') DEFAULT 'todo',
    dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

-- =====================================================
-- CREATE TRIGGERS FOR AUTOMATED UPDATES
-- =====================================================

-- Trigger to update project learningPoints when learning entry is added
DELIMITER //
CREATE TRIGGER after_learning_insert
AFTER INSERT ON learning_entries
FOR EACH ROW
BEGIN
    UPDATE projects 
    SET learningPoints = learningPoints + (NEW.difficulty * 10)
    WHERE id = NEW.projectId;
END//

-- Trigger to update project totals when daily report is added
CREATE TRIGGER after_report_insert
AFTER INSERT ON daily_reports
FOR EACH ROW
BEGIN
    UPDATE projects 
    SET totalHours = totalHours + NEW.hoursWorked,
        activeDays = activeDays + 1,
        lastActive = NOW()
    WHERE id = NEW.projectId;
END//

-- Trigger to update daily_hours when report is added
CREATE TRIGGER after_report_insert_hours
AFTER INSERT ON daily_reports
FOR EACH ROW
BEGIN
    INSERT INTO daily_hours (projectId, date, hours)
    VALUES (NEW.projectId, NEW.date, NEW.hoursWorked)
    ON DUPLICATE KEY UPDATE hours = hours + NEW.hoursWorked;
END//

DELIMITER ;

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert sample project
INSERT INTO projects (name, category, color, totalTasks, completedTasks, features, bugsFixed, refactors, commits) 
VALUES ('NeuralCart', 'E-Commerce', '#00FFB2', 84, 61, 22, 18, 9, 198);

SET @projectId = LAST_INSERT_ID();

-- Insert tech stack
INSERT INTO tech_stack (projectId, technology) VALUES 
(@projectId, 'Next.js'),
(@projectId, 'PostgreSQL'),
(@projectId, 'Redis');

-- Insert weekly hours
INSERT INTO weekly_hours (projectId, weekStartDate, monday, tuesday, wednesday, thursday, friday, saturday, sunday)
VALUES (@projectId, CURDATE() - INTERVAL 7 DAY, 4, 6, 3, 7, 5, 2, 4);

-- Insert daily hours for last 15 days
INSERT INTO daily_hours (projectId, date, hours) VALUES
(@projectId, CURDATE() - INTERVAL 14 DAY, 24),
(@projectId, CURDATE() - INTERVAL 13 DAY, 38),
(@projectId, CURDATE() - INTERVAL 12 DAY, 42),
(@projectId, CURDATE() - INTERVAL 11 DAY, 31),
(@projectId, CURDATE() - INTERVAL 10 DAY, 28),
(@projectId, CURDATE() - INTERVAL 9 DAY, 35),
(@projectId, CURDATE() - INTERVAL 8 DAY, 41),
(@projectId, CURDATE() - INTERVAL 7 DAY, 29),
(@projectId, CURDATE() - INTERVAL 6 DAY, 33),
(@projectId, CURDATE() - INTERVAL 5 DAY, 27),
(@projectId, CURDATE() - INTERVAL 4 DAY, 38),
(@projectId, CURDATE() - INTERVAL 3 DAY, 44),
(@projectId, CURDATE() - INTERVAL 2 DAY, 30),
(@projectId, CURDATE() - INTERVAL 1 DAY, 45),
(@projectId, CURDATE(), 32);

-- Insert git metrics
INSERT INTO git_metrics (projectId, pullRequests, mergedPRs, codeReviews, languages)
VALUES (@projectId, 25, 20, 15, '{"JavaScript": 45, "TypeScript": 30, "SQL": 25}');

-- Insert sample learning entry
INSERT INTO learning_entries (projectId, concept, category, difficulty, type, confidence, dateLogged, timeSpent)
VALUES (@projectId, 'Redis Pub/Sub', 'Backend', 4, 'New concept', 'Medium', CURDATE(), 2.5);

SET @learningId = LAST_INSERT_ID();

-- Insert learning resources
INSERT INTO learning_resources (learningEntryId, resource) VALUES
(@learningId, 'Redis docs'),
(@learningId, 'YouTube tutorial');

-- Insert sample daily report
INSERT INTO daily_reports (projectId, date, hoursWorked, tasksDone, notes, mood, focusScore)
VALUES (@projectId, CURDATE(), 4, 3, 'Fixed checkout race condition', 'productive', 8);

-- Insert sample documentation
INSERT INTO documentation (projectId, title, content, status, date)
VALUES (@projectId, 'Redis Pub/Sub Implementation', 'Implemented message queue system using Redis pub/sub for real-time updates...', 'complete', CURDATE());

-- Insert sample goal
INSERT INTO goals (projectId, title, target, current, category)
VALUES (@projectId, 'Master Redis patterns', 100, 75, 'Learning');
