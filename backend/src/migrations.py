import logging

from sqlalchemy import inspect, text

logger = logging.getLogger(__name__)


def run_migrations(engine):
    """
    Lightweight schema auto-migration for SQLite and PostgreSQL databases.
    Ensures that existing databases receive new columns and tables without data loss.
    """
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        with engine.connect() as conn:
            # 1. Check daily_activity columns
            if "daily_activity" in tables:
                columns = [c["name"] for c in inspector.get_columns("daily_activity")]
                if "course_breakdown" not in columns:
                    logger.info(
                        "Migrating daily_activity: adding course_breakdown column"
                    )
                    conn.execute(
                        text(
                            "ALTER TABLE daily_activity ADD COLUMN course_breakdown TEXT NOT NULL DEFAULT '{}'"
                        )
                    )
                    conn.commit()

                if "subject_breakdown" not in columns:
                    logger.info(
                        "Migrating daily_activity: adding subject_breakdown column"
                    )
                    conn.execute(
                        text(
                            "ALTER TABLE daily_activity ADD COLUMN subject_breakdown TEXT NOT NULL DEFAULT '{}'"
                        )
                    )
                    conn.commit()

            # 2. Check or create daily_course_activity table
            if "daily_course_activity" not in tables:
                logger.info("Creating daily_course_activity table")
                conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS daily_course_activity (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            date VARCHAR(10) NOT NULL,
                            course_id INTEGER NOT NULL,
                            course_name VARCHAR(255),
                            study_seconds INTEGER NOT NULL DEFAULT 0,
                            pomodoros INTEGER NOT NULL DEFAULT 0,
                            lessons INTEGER NOT NULL DEFAULT 0,
                            CONSTRAINT uq_daily_course UNIQUE (date, course_id)
                        )
                        """))
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS idx_daily_course_date ON daily_course_activity(date)"
                    )
                )
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS idx_daily_course_id ON daily_course_activity(course_id)"
                    )
                )
                conn.commit()

            # 3. Check or create study_events table
            if "study_events" not in tables:
                logger.info("Creating study_events table")
                conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS study_events (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            title VARCHAR(255) NOT NULL,
                            date VARCHAR(10) NOT NULL,
                            time VARCHAR(5),
                            category VARCHAR(50) NOT NULL DEFAULT 'lembrete',
                            color VARCHAR(30),
                            notes TEXT,
                            done BOOLEAN NOT NULL DEFAULT 0,
                            course_id INTEGER,
                            created_at DATETIME,
                            updated_at DATETIME,
                            FOREIGN KEY(course_id) REFERENCES course(id) ON DELETE SET NULL
                        )
                        """))
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS idx_study_events_date ON study_events(date)"
                    )
                )
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS idx_study_events_course_id ON study_events(course_id)"
                    )
                )
                conn.commit()

            # 4. Check or create subjects table
            if "subjects" not in tables:
                logger.info("Creating subjects table")
                conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS subjects (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name VARCHAR(150) NOT NULL,
                            color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
                            code VARCHAR(50),
                            semester VARCHAR(50),
                            is_archived BOOLEAN NOT NULL DEFAULT 0,
                            created_at DATETIME
                        )
                        """))
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS idx_subjects_is_archived ON subjects(is_archived)"
                    )
                )
                conn.commit()

            # 5. Check or create daily_subject_activity table
            if "daily_subject_activity" not in tables:
                logger.info("Creating daily_subject_activity table")
                conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS daily_subject_activity (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            date VARCHAR(10) NOT NULL,
                            subject_id INTEGER,
                            subject_name VARCHAR(150),
                            study_seconds INTEGER NOT NULL DEFAULT 0,
                            pomodoros INTEGER NOT NULL DEFAULT 0,
                            CONSTRAINT uq_daily_subject UNIQUE (date, subject_id)
                        )
                        """))
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS idx_daily_subject_date ON daily_subject_activity(date)"
                    )
                )
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS idx_daily_subject_id ON daily_subject_activity(subject_id)"
                    )
                )
                conn.commit()

        logger.info("Database migrations executed successfully.")
    except Exception as e:
        logger.error("Error running database migrations: %s", e)
        raise
