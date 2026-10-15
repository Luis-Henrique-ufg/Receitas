from sqlalchemy.orm import synonym

from database import db


class Course(db.Model):
    __tablename__ = "course"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    path = db.Column(db.String(255), nullable=False)
    is_cover_url = db.Column("isCoverUrl", db.Integer, default=0)
    file_cover = db.Column("fileCover", db.String(255), nullable=True)
    url_cover = db.Column("urlCover", db.String(255), nullable=True)
    position = db.Column(db.Integer, default=0)

    # Compatibilidade retroativa para acessos legado
    isCoverUrl = synonym("is_cover_url")
    fileCover = synonym("file_cover")
    urlCover = synonym("url_cover")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "path": self.path,
            "isCoverUrl": bool(self.is_cover_url),
            "fileCover": self.file_cover,
            "urlCover": self.url_cover,
            "position": self.position,
        }
