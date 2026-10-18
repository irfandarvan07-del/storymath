import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.ai.schema import StoryOutput

logger = logging.getLogger(__name__)

CACHE_FILE = Path(__file__).parent / "story_pool.json"


class StoryCache:
    """
    In-memory and file-backed cache of pre-generated and validated stories.
    Ensures zero-latency responses and guarantees verified offline operation.
    """
    def __init__(self, cache_file: Optional[Path] = None):
        self.cache_file = cache_file or CACHE_FILE
        self._pool: Dict[str, List[Dict[str, Any]]] = {}
        self.load()

    def load(self):
        """Loads cached stories from JSON file."""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    self._pool = json.load(f)
                logger.info(f"Loaded {sum(len(v) for v in self._pool.values())} cached stories from {self.cache_file.name}")
            except Exception as e:
                logger.warning(f"Could not load story cache: {e}")
                self._pool = {}
        else:
            self._pool = {}

    def save(self):
        """Persists cached pool to JSON file."""
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self._pool, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not save story cache: {e}")

    def get_key(self, template_id: str, interest: Optional[str]) -> str:
        int_key = (interest or "default").lower().strip()
        return f"{template_id}:{int_key}"

    def get(self, template_id: str, interest: Optional[str] = None) -> Optional[StoryOutput]:
        key = self.get_key(template_id, interest)
        candidates = self._pool.get(key, [])
        if not candidates and interest:
            # Fallback to default interest for this template
            key = self.get_key(template_id, "default")
            candidates = self._pool.get(key, [])

        if candidates:
            # Return the first candidate or pop from rotating pool
            item = candidates[0]
            return StoryOutput(
                story=item["story"],
                question=item["question"],
                hint_1=item["hint_1"],
                hint_2=item["hint_2"],
                hint_3=item["hint_3"]
            )
        return None

    def put(self, template_id: str, interest: Optional[str], output: StoryOutput, numbers: Dict[str, Any]):
        key = self.get_key(template_id, interest)
        entry = {
            "template_id": template_id,
            "interest": interest or "default",
            "numbers": numbers,
            "story": output.story,
            "question": output.question,
            "hint_1": output.hint_1,
            "hint_2": output.hint_2,
            "hint_3": output.hint_3
        }
        self._pool.setdefault(key, []).append(entry)
        self.save()

    def count(self) -> int:
        return sum(len(v) for v in self._pool.values())


# Global cache instance
story_cache = StoryCache()
