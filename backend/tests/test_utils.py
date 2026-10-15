from utils import VIDEO_EXTENSIONS, natural_sort_key, translate_to_container_path


class TestNaturalSortKey:
    def test_natural_sort_orders_numerically(self):
        items = ["aula 10", "aula 2", "aula 1", "aula 20"]
        sorted_items = sorted(items, key=natural_sort_key)
        assert sorted_items == ["aula 1", "aula 2", "aula 10", "aula 20"]

    def test_natural_sort_multi_level(self):
        items = [
            "Modulo 10 - Aula 2",
            "Modulo 2 - Aula 10",
            "Modulo 2 - Aula 1",
            "Modulo 1 - Aula 5",
        ]
        sorted_items = sorted(items, key=natural_sort_key)
        assert sorted_items == [
            "Modulo 1 - Aula 5",
            "Modulo 2 - Aula 1",
            "Modulo 2 - Aula 10",
            "Modulo 10 - Aula 2",
        ]

    def test_natural_sort_case_insensitivity(self):
        items = ["aula 2", "Aula 1", "AULA 3"]
        sorted_items = sorted(items, key=natural_sort_key)
        assert [s.lower() for s in sorted_items] == ["aula 1", "aula 2", "aula 3"]

    def test_natural_sort_empty_and_none(self):
        assert natural_sort_key("") == []
        assert natural_sort_key(None) == []

    def test_pure_digits(self):
        items = ["100", "2", "10", "1"]
        sorted_items = sorted(items, key=natural_sort_key)
        assert sorted_items == ["1", "2", "10", "100"]


class TestVideoExtensions:
    def test_supported_extensions(self):
        expected = {
            ".mp4",
            ".avi",
            ".mov",
            ".wmv",
            ".flv",
            ".mkv",
            ".webm",
            ".ts",
            ".m4v",
            ".3gp",
        }
        assert set(VIDEO_EXTENSIONS) == expected

    def test_video_extension_matching(self):
        valid_files = ["video.mp4", "aula.MKV", "clip.webm", "recording.ts"]
        invalid_files = ["notes.txt", "slides.pdf", "image.png", "archive.zip"]

        for vf in valid_files:
            assert vf.lower().endswith(VIDEO_EXTENSIONS) is True

        for ivf in invalid_files:
            assert ivf.lower().endswith(VIDEO_EXTENSIONS) is False


class TestTranslateToContainerPath:
    def test_empty_path(self):
        assert translate_to_container_path("") == ""
        assert translate_to_container_path(None) is None

    def test_unmapped_path_returns_original(self):
        original = "C:\\Users\\User\\Downloads\\Curso Python\\aula1.mp4"
        result = translate_to_container_path(original)
        assert result == original
