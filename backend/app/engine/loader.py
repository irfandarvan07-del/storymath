import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import yaml
from pydantic import BaseModel, Field

from app.config import TEMPLATES_DIR


class TemplateSchema(BaseModel):
    id: str = Field(..., description="Unique template ID e.g. share_equal_01")
    structure: str = Field(..., description="equal_sharing, equal_groups, difference_comparison, unit_rate, fraction_of_a_quantity, perimeter_area")
    text_pattern: str = Field(..., description="Template text with placeholders")
    question_pattern: Optional[str] = Field(None, description="Specific question prompt")
    numbers: Dict[str, Any] = Field(..., description="Ranges for free variables and formulas for dependent variables")
    answer: str = Field(..., description="Formula for computing the correct answer")
    model: str = Field(..., description="groups_picture | bar_model | number_line")
    operation: str = Field(..., description="addition | subtraction | multiplication | division")
    sense_check: Optional[str] = Field(None, description="Comparison condition, e.g. 'answer < total'")
    sense_check_prompt: str = Field(..., description="Prompt presented to student e.g. 'Should the answer be bigger or smaller than {total}?'")
    sense_check_answer: str = Field(..., description="Expected sense check response: 'smaller' or 'bigger'")
    items: Optional[List[str]] = Field(default_factory=list)
    people: Optional[List[str]] = Field(default_factory=list)
    hints: Dict[str, str] = Field(
        ...,
        description="3-tier hint ladder: level_1 (structure), level_2 (model), level_3 (worked parallel example)"
    )


class TemplateRegistry:
    def __init__(self, templates_dir: Optional[Path] = None):
        self.templates_dir = templates_dir or TEMPLATES_DIR
        self._templates: Dict[str, TemplateSchema] = {}
        self._by_structure: Dict[str, List[TemplateSchema]] = {}

    def load_all(self) -> Dict[str, TemplateSchema]:
        """Loads and validates all YAML template files from directory."""
        self._templates.clear()
        self._by_structure.clear()

        if not self.templates_dir.exists():
            return self._templates

        for filepath in self.templates_dir.glob("*.yaml"):
            with open(filepath, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if not data or not isinstance(data, dict):
                    continue
                template = TemplateSchema(**data)
                self._templates[template.id] = template
                self._by_structure.setdefault(template.structure, []).append(template)

        for filepath in self.templates_dir.glob("*.yml"):
            if filepath.stem not in self._templates:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    if not data:
                        continue
                    template = TemplateSchema(**data)
                    self._templates[template.id] = template
                    self._by_structure.setdefault(template.structure, []).append(template)

        return self._templates

    def get(self, template_id: str) -> Optional[TemplateSchema]:
        if not self._templates:
            self.load_all()
        return self._templates.get(template_id)

    def get_all(self) -> List[TemplateSchema]:
        if not self._templates:
            self.load_all()
        return list(self._templates.values())

    def get_by_structure(self, structure: str) -> List[TemplateSchema]:
        if not self._templates:
            self.load_all()
        return self._by_structure.get(structure, [])

    def structures(self) -> List[str]:
        if not self._templates:
            self.load_all()
        return list(self._by_structure.keys())


# Global registry singleton
registry = TemplateRegistry()
