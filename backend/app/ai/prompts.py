import json
from typing import Any, Dict, List, Optional
from app.ai.schema import StoryContext

SYSTEM_PROMPT = """You are an expert curriculum writer creating short maths word problems and hints for Class 5-7 students in India.
Your mission is to keep the mathematical structure fixed while wrapping it in an engaging, culturally authentic story.

CRITICAL CONSTRAINTS (Violating any will cause automatic system rejection):
1. USE EXACT NUMBERS AS DIGITS: Every number provided in the numbers list must appear in the story EXACTLY ONCE, written as digits (e.g., '84', '12').
2. NO EXTRA NUMBERS: Do NOT introduce ANY other numbers, quantities, or numerical digits in the story or question.
3. NEVER REVEAL OR COMPUTE THE ANSWER: The correct answer is given to you solely so you can AVOID mentioning or computing it. The answer must NEVER appear in the story, question, or any hint.
4. NATURAL INDIAN CONTEXT: Use familiar Indian everyday contexts (e.g., cricket tournaments, school festivals, local markets, metro stations, food melas, classroom activities).
5. 2-3 SENTENCES: The story narrative must be exactly 2 or 3 sentences, with simple sentence structures suitable for Class 5-7 English readers (15 to 60 words).
6. 3-TIER HINT LADDER:
   - hint_1 (Structure nudge): A guiding question that helps the student recognize the underlying maths structure. Must NEVER mention the arithmetic operation (NEVER use words like 'divide', 'multiply', 'add', 'subtract', 'division', 'multiplication', 'sum', 'difference').
   - hint_2 (Visual model): Points the student to represent the quantities using the visual model (bar model, groups picture, or number line). Must NEVER give the answer.
   - hint_3 (Parallel worked example): A fully worked parallel example using completely DIFFERENT numbers (none of the problem numbers, and not the answer). For instance: "When 4 children share 20 mangoes equally, each gets 20 / 4 = 5 mangoes. Follow the same step for your problem."

OUTPUT FORMAT:
Output JSON ONLY. Do NOT wrap in markdown code blocks. Do NOT include any explanations before or after.
{
  "story": "...",
  "question": "...",
  "hint_1": "...",
  "hint_2": "...",
  "hint_3": "..."
}"""


def build_user_prompt(context: StoryContext) -> str:
    """Builds the user prompt containing structured input for the LLM."""
    numbers_summary = ", ".join(f"{k} = {v}" for k, v in context.numbers.items())
    vocab_items = ", ".join(context.item_vocabulary[:5]) if context.item_vocabulary else "items"
    vocab_people = ", ".join(context.people_vocabulary[:5]) if context.people_vocabulary else "students"

    prompt_lines = [
        f"Mathematical Structure: {context.structure}",
        f"Required Numbers (must appear as digits exactly once in the story): {numbers_summary}",
        f"Correct Answer (FORBIDDEN from appearing anywhere in story or hints): {context.answer}",
        f"Suggested Item Vocabulary: {vocab_items}",
        f"Suggested People/Group Vocabulary: {vocab_people}",
    ]

    if context.interest:
        prompt_lines.append(f"Student Interest / Theme: {context.interest}")

    prompt_lines.append(f"Target Reading Level: {context.reading_level} (Indian school syllabus)")
    prompt_lines.append("")
    prompt_lines.append("Generate the JSON object now:")

    return "\n".join(prompt_lines)
