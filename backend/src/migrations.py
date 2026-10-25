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
            # 1. Check daily_activity.course_breakdown
            if "daily_activity" in tables:
                columns = [c["name"] for c in inspector.get_columns("daily_activity")]
                if "course_breakdown" not in columns:
                    logger.info("Migrating daily_activity: adding course_breakdown column")
                    conn.execute(
                        text("ALTER TABLE daily_activity ADD COLUMN course_breakdown TEXT NOT NULL DEFAULT '{}'")
                    )
                    conn.commit()

            # 2. Check or create daily_course_activity table
            if "daily_course_activity" not in tables:
                logger.info("Creating daily_course_activity table")
                conn.execute(
                    text(
                        """
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
                        """
                    )
                )
                conn.execute(
                    text("CREATE INDEX IF NOT EXISTS idx_daily_course_date ON daily_course_activity(date)")
                )
                conn.execute(
                    text("CREATE INDEX IF NOT EXISTS idx_daily_course_id ON daily_course_activity(course_id)")
                )
                conn.commit()

        logger.info("Database migrations executed successfully.")
    except Exception as e:
        logger.error("Error running database migrations: %s", e)
        raise
