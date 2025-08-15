-- Messaging tables
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  thread_id BIGINT DEFAULT 0,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  body TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_msg_user (recipient_id, is_read, created_at),
  INDEX idx_msg_thread (thread_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
