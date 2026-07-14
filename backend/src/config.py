import os

class Config:
    # Get the absolute path to the directory where config.py is located
    basedir = os.path.abspath(os.path.dirname(__file__))
    
    # Path for data persistence
    DATA_DIR = os.environ.get('DATA_DIR', os.path.join(basedir, 'data'))
    os.makedirs(os.path.join(DATA_DIR, 'uploads'), exist_ok=True)
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f"sqlite:///{os.path.join(DATA_DIR, 'platform_course.sqlite')}?cache=shared"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(DATA_DIR, 'uploads')
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key_here')