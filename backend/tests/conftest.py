import tempfile

import pytest
from flask import Flask

from blueprints import (
    courses_bp,
    events_bp,
    lessons_bp,
    media_bp,
    search_bp,
    stats_bp,
    subjects_bp,
)
from database import db


@pytest.fixture
def app():
    test_app = Flask(__name__)
    upload_dir = tempfile.mkdtemp()
    test_app.config.update(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "UPLOAD_FOLDER": upload_dir,
            "SECRET_KEY": "test-secret-key",
        }
    )
    db.init_app(test_app)
    test_app.register_blueprint(courses_bp)
    test_app.register_blueprint(events_bp)
    test_app.register_blueprint(lessons_bp)
    test_app.register_blueprint(media_bp)
    test_app.register_blueprint(search_bp)
    test_app.register_blueprint(stats_bp)
    test_app.register_blueprint(subjects_bp)

    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db_session(app):
    with app.app_context():
        yield db.session
