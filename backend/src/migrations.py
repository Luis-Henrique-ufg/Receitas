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

            # 6. Reconcile existing daily_activity with daily_subject_activity
            if "daily_activity" in tables and "daily_subject_activity" in tables:
                # Clean up any daily_subject_activity rows where subject_id is NULL and pomodoros = 0 (e.g. passive video heartbeats)
                conn.execute(
                    text(
                        "DELETE FROM daily_subject_activity WHERE subject_id IS NULL AND pomodoros = 0"
                    )
                )
                conn.commit()

                # Clean up "none" with 0 pomodoros in daily_activity.subject_breakdown
                import json

                act_rows = conn.execute(
                    text(
                        "SELECT id, subject_breakdown FROM daily_activity WHERE subject_breakdown LIKE '%\"none\"%'"
                    )
                ).fetchall()
                for aid, sb_str in act_rows:
                    try:
                        sb = json.loads(sb_str) if sb_str else {}
                        if "none" in sb and sb["none"].get("pomodoros", 0) == 0:
                            del sb["none"]
                            conn.execute(
                                text(
                                    "UPDATE daily_activity SET subject_breakdown = :sb WHERE id = :id"
                                ),
                                {"sb": json.dumps(sb), "id": aid},
                            )
                            conn.commit()
                    except Exception:
                        pass

                rows = conn.execute(
                    text(
                        "SELECT date, study_seconds, pomodoros_completed FROM daily_activity WHERE pomodoros_completed > 0"
                    )
                ).fetchall()
                for r in rows:
                    r_date, r_sec, r_pom = r[0], r[1] or 0, r[2] or 0
                    assigned = conn.execute(
                        text(
                            "SELECT COALESCE(SUM(study_seconds), 0), COALESCE(SUM(pomodoros), 0) FROM daily_subject_activity WHERE date = :d"
                        ),
                        {"d": r_date},
                    ).fetchone()
                    assigned_sec = assigned[0] if assigned else 0
                    assigned_pom = assigned[1] if assigned else 0
                    diff_pom = max(0, r_pom - assigned_pom)

                    # Only backfill into 'Sem matéria' if there are unassigned POMODOROS
                    if diff_pom > 0:
                        diff_sec = max(0, r_sec - assigned_sec)
                        if diff_sec == 0:
                            diff_sec = diff_pom * 1500
                        existing_null = conn.execute(
                            text(
                                "SELECT id, study_seconds, pomodoros FROM daily_subject_activity WHERE date = :d AND subject_id IS NULL"
                            ),
                            {"d": r_date},
                        ).fetchone()
                        if existing_null:
                            conn.execute(
                                text(
                                    "UPDATE daily_subject_activity SET study_seconds = study_seconds + :sec, pomodoros = pomodoros + :pom WHERE id = :id"
                                ),
                                {
                                    "sec": diff_sec,
                                    "pom": diff_pom,
                                    "id": existing_null[0],
                                },
                            )
                        else:
                            conn.execute(
                                text(
                                    "INSERT INTO daily_subject_activity (date, subject_id, subject_name, study_seconds, pomodoros) VALUES (:d, NULL, 'Sem matéria', :sec, :pom)"
                                ),
                                {"d": r_date, "sec": diff_sec, "pom": diff_pom},
                            )
                        conn.commit()

        logger.info("Database migrations executed successfully.")
    except Exception as e:
        logger.error("Error running database migrations: %s", e)
        raise
