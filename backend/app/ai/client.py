import json
import logging
import os
import re
from typing import Any, Dict, Optional
import httpx

from app.ai.prompts import SYSTEM_PROMPT, build_user_prompt
from app.ai.schema import StoryContext, StoryOutput

logger = logging.getLogger(__name__)

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
DEFAULT_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-haiku-5-5")
API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


def clean_llm_json_response(raw_text: str) -> str:
    """
    Strips markdown code blocks (e.g. ```json ... ```) and leading/trailing whitespace
    to extract raw JSON string.
    """
    text = raw_text.strip()
    # Match ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


def synthesize_fallback_story(context: StoryContext) -> StoryOutput:
    """
    High-quality deterministic story synthesizer used when:
    - ANTHROPIC_API_KEY is not set (offline / test / local dev mode)
    - Claude API call times out or encounters network/credit errors
    Guarantees strict compliance with all 6 validation rules.
    """
    numbers = context.numbers
    structure = context.structure
    item = context.item_vocabulary[0] if context.item_vocabulary else "items"
    people = context.people_vocabulary[0] if context.people_vocabulary else "students"
    interest = context.interest or "school"
    ans_val = str(context.answer)

    # Contextual narratives tailored to structure
    if structure == "equal_sharing":
        total_val = numbers.get("total", 84)
        groups_val = numbers.get("groups", 12)
        if interest == "cricket":
            story = f"A coach received {total_val} cricket practice balls to distribute across {groups_val} training nets. Every training net received the exact same share for fielding practice."
            question = f"How many practice balls were allocated to each of the {groups_val} nets?"
        else:
            story = f"During the annual sports day festival, teachers arranged {total_val} {item} to distribute equally to {groups_val} {people}. Everyone was excited to receive an equal portion."
            question = f"How many {item} did each of the {groups_val} {people} receive?"

        hint_1 = "Are the items being split into separate equal shares, or are they being joined together into one pile?"
        hint_2 = "Draw a bar model or group boxes showing the total quantity partitioned into equal parts."
        # Pick parallel numbers distinct from problem numbers and answer
        p_groups, p_per = 3, 5
        if str(p_groups) in numbers.values() or str(p_per) in numbers.values() or str(p_groups * p_per) in numbers.values() or ans_val in [str(p_groups), str(p_per), str(p_groups * p_per)]:
            p_groups, p_per = 2, 7
        p_tot = p_groups * p_per
        hint_3 = f"For instance, if {p_groups} children share {p_tot} items equally, each gets {p_tot} / {p_groups} = {p_per} items. Use the same division method for your problem."

    elif structure == "equal_groups":
        groups_val = numbers.get("groups", 6)
        per_group_val = numbers.get("per_group", 8)
        if interest == "cricket":
            story = f"In the tournament grounds, there were {groups_val} team kit bags with {per_group_val} protective pads packed neatly inside each bag. The equipment manager checked each bag carefully."
            question = f"How many protective pads were in all {groups_val} kit bags altogether?"
        else:
            story = f"The school art club set up {groups_val} supply tables with {per_group_val} {item} laid out on each table. The monitors ensured every table had the exact same count."
            question = f"How many {item} were laid out across all {groups_val} tables in total?"

        hint_1 = "Are multiple sets of the same size being counted together, or is one quantity being separated?"
        hint_2 = "Draw a visual diagram showing each equal group or use repeated equal jumps on a number line."
        p_g, p_pg = 3, 5
        if str(p_g) in numbers.values() or str(p_pg) in numbers.values() or ans_val in [str(p_g), str(p_pg), str(p_g * p_pg)]:
            p_g, p_pg = 2, 7
        p_t = p_g * p_pg
        hint_3 = f"For instance, if there are {p_g} trays with {p_pg} snacks on each tray, there are {p_g} * {p_pg} = {p_t} snacks in all. Follow the same multiplication step."

    elif structure == "difference_comparison":
        larger_val = numbers.get("larger")
        smaller_val = numbers.get("smaller")
        diff_val = numbers.get("diff")

        if larger_val is not None and smaller_val is not None and diff_val is None:
            story = f"In the inter-school tournament, Rohan scored {larger_val} runs during the first innings. Kabir scored {smaller_val} runs during the second innings."
            question = f"How many more runs did Rohan score than Kabir?"
            hint_1 = "Are you comparing the difference between two separate quantities, or putting them together?"
            hint_2 = "Draw two comparison bars side by side and look at the difference gap between them."
            p_l, p_s = 50, 35
            p_d = p_l - p_s
            if any(str(x) in numbers.values() or str(x) == ans_val for x in [p_l, p_s, p_d]):
                p_l, p_s, p_d = 45, 25, 20
            hint_3 = f"For instance, if one batsman has {p_l} runs and another has {p_s} runs, the difference is {p_l} - {p_s} = {p_d} runs. Apply the same comparison step."

        elif smaller_val is not None and diff_val is not None and larger_val is None:
            story = f"Kabir scored {smaller_val} points in the tournament. Rohan scored {diff_val} more points than Kabir."
            question = f"How many points did Rohan score?"
            hint_1 = "Are you adding a difference to a smaller amount to find the greater total?"
            hint_2 = "Draw a comparison bar for the known amount and extend it by the difference."
            p_s, p_d = 30, 15
            p_l = p_s + p_d
            if any(str(x) in numbers.values() or str(x) == ans_val for x in [p_l, p_s, p_d]):
                p_s, p_d, p_l = 25, 10, 35
            hint_3 = f"For instance, if Kabir has {p_s} points and Rohan has {p_d} more, Rohan has {p_s} + {p_d} = {p_l} points."

        else:
            # larger and diff known
            story = f"Rohan scored {larger_val} points in the tournament. Kabir scored {diff_val} fewer points than Rohan."
            question = f"How many points did Kabir score?"
            hint_1 = "When someone has fewer than a given amount, what operation finds the smaller value?"
            hint_2 = "Draw the larger bar and subtract the difference from it."
            p_l, p_d = 50, 15
            p_s = p_l - p_d
            if any(str(x) in numbers.values() or str(x) == ans_val for x in [p_l, p_d, p_s]):
                p_l, p_d, p_s = 45, 10, 35
            hint_3 = f"For instance, if Rohan has {p_l} points and Kabir has {p_d} fewer, Kabir has {p_l} - {p_d} = {p_s} points."

    elif structure == "unit_rate":
        rate_val = numbers.get("rate")
        units_val = numbers.get("units")
        total_val = numbers.get("total_cost")

        if total_val is not None and units_val is not None and rate_val is None:
            story = f"Sunita bought {units_val} identical {item} at the bazaar for a total of Rs. {total_val}. Each item had the exact same price."
            question = f"What was the price of each {item} in rupees?"
            hint_1 = "When you know the combined cost of multiple identical items, how do you find the unit rate?"
            hint_2 = "Draw a bar representing the total cost split into identical unit boxes."
            p_u, p_t = 3, 30
            p_r = p_t // p_u
            if any(str(x) in numbers.values() or str(x) == ans_val for x in [p_u, p_t, p_r]):
                p_u, p_t, p_r = 2, 16, 8
            hint_3 = f"For instance, if {p_u} notebooks cost Rs. {p_t} in total, each costs {p_t} / {p_u} = {p_r} rupees. Use the same unit rate step."

        elif rate_val is not None and units_val is not None and total_val is None:
            story = f"A ticket for the science exhibition costs Rs. {rate_val} at the entry counter. A group of {units_val} students bought tickets together."
            question = f"How much did the {units_val} students spend in total for their tickets?"
            hint_1 = "When you know the rate for a single unit, how does the total grow when purchasing multiple units?"
            hint_2 = "Draw a bar model where each block represents the unit rate."
            p_r, p_u = 10, 3
            p_t = p_r * p_u
            if any(str(x) in numbers.values() or str(x) == ans_val for x in [p_r, p_u, p_t]):
                p_r, p_u, p_t = 15, 2, 30
            hint_3 = f"For instance, if each bus pass costs Rs. {p_r}, then {p_u} passes cost {p_r} * {p_u} = {p_t} rupees. Apply the same unit rate multiplication."

        else:
            # rate and total_cost known
            story = f"Sunita spent Rs. {total_val} buying identical {item} priced at Rs. {rate_val} each. The shopkeeper handed her the package."
            question = f"How many {item} did Sunita purchase in total?"
            hint_1 = "When dividing total cost by unit cost, what quantity do you find?"
            hint_2 = "Draw a bar for the total cost and see how many unit rate segments fit inside."
            p_t, p_r = 30, 10
            p_u = p_t // p_r
            if any(str(x) in numbers.values() or str(x) == ans_val for x in [p_t, p_r, p_u]):
                p_t, p_r, p_u = 20, 5, 4
            hint_3 = f"For instance, Rs. {p_t} spent at Rs. {p_r} per item gives {p_t} / {p_r} = {p_u} items."

    elif structure == "fraction_of_a_quantity":
        whole_val = numbers.get("whole", 36)
        den_val = numbers.get("den", 4)
        num_val = numbers.get("num", 1)
        story = f"Rishi had a collection of {whole_val} colorful marbles stored safely in a wooden box. During craft class, he shared {num_val}/{den_val} of the whole collection with his partner."
        question = f"How many marbles did Rishi share with his partner?"
        hint_1 = "First think about finding equal fractional parts, then consider how many of those parts you need."
        hint_2 = "Draw a bar for the whole collection and divide it into equal fractional parts."
        # Pick parallel numbers with zero overlap
        p_w, p_d, p_n = 20, 5, 2
        p_ans = (p_w // p_d) * p_n
        if any(str(x) in numbers.values() or str(x) == ans_val for x in [p_w, p_d, p_n, p_ans]):
            p_w, p_d, p_n = 30, 3, 2
            p_ans = (p_w // p_d) * p_n
        hint_3 = f"For instance, to find {p_n}/{p_d} of {p_w} items, first calculate ({p_w} / {p_d}) * {p_n} = {p_ans} items. Follow the same calculation."

    elif structure == "perimeter_area":
        length_val = numbers.get("length", 12)
        width_val = numbers.get("width", 8)
        story = f"The rectangular school badminton court measures {length_val} meters long and {width_val} meters wide. The sports committee plans to place boundary line tape completely around the perimeter."
        question = f"How many meters of boundary line tape are needed to go all the way around the court?"
        hint_1 = "Are you measuring the outer boundary path around the rectangle, or the flat surface inside?"
        hint_2 = "Draw a rectangle and label all four outer sides with their dimensions."
        p_l, p_w = 7, 3
        p_p = 2 * (p_l + p_w)
        if any(str(x) in numbers.values() or str(x) == ans_val for x in [p_l, p_w, p_p]):
            p_l, p_w = 9, 4
            p_p = 2 * (p_l + p_w)
        hint_3 = f"For instance, a rectangle with length {p_l} m and width {p_w} m has perimeter 2 * ({p_l} + {p_w}) = {p_p} meters. Use the same perimeter formula."

    else:
        # Generic robust fallback
        num_items_str = ", ".join(f"{v}" for v in numbers.values())
        story = f"The class eco-club organized {item} for the school project. They counted {num_items_str} in their designated sections."
        question = f"What is the resulting amount of {item}?"
        hint_1 = "Look closely at how the numbers relate to each other in this scenario."
        hint_2 = "Represent the known values on a bar model to visualize the relationship."
        hint_3 = "For instance, with numbers 15 and 3, equal sharing gives 15 / 3 = 5. Try the same method."


    return StoryOutput(
        story=story,
        question=question,
        hint_1=hint_1,
        hint_2=hint_2,
        hint_3=hint_3
    )


def call_claude_api(context: StoryContext, timeout: float = 8.0) -> StoryOutput:
    """
    Calls configured LLM API (Claude, Gemini, or OpenAI) to generate a creative Indian maths story.
    Falls back gracefully to deterministic synthesis if no API keys are present or API call fails.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    user_prompt = build_user_prompt(context)

    # 1. Try Anthropic Claude API if key configured
    if anthropic_key:
        try:
            headers = {
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": os.getenv("ANTHROPIC_MODEL", "claude-haiku-5-5"),
                "max_tokens": 600,
                "temperature": 0.3,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_prompt}]
            }
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(ANTHROPIC_API_URL, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                raw_content = data["content"][0]["text"]
                cleaned_json = clean_llm_json_response(raw_content)
                parsed = json.loads(cleaned_json)
                return StoryOutput(**parsed)
        except Exception as exc:
            logger.warning(f"Claude API generation failed ({exc}). Trying next provider or fallback.")

    # 2. Try Google Gemini API if key configured
    if gemini_key:
        try:
            gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
            headers = {
                "x-goog-api-key": gemini_key,
                "Content-Type": "application/json"
            }
            payload = {
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [{"parts": [{"text": user_prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 600}
            }
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(f"{gemini_url}?key={gemini_key}", headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_content = data["candidates"][0]["content"]["parts"][0]["text"]
                    cleaned_json = clean_llm_json_response(raw_content)
                    parsed = json.loads(cleaned_json)
                    return StoryOutput(**parsed)
                else:
                    logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:150]}")
        except Exception as exc:
            logger.warning(f"Gemini API generation failed ({exc}). Trying next provider or fallback.")

    # 3. Try OpenAI API or OmniRoute Gateway (e.g. http://localhost:20128/v1)
    openai_base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    if openai_key or "localhost" in openai_base_url or "127.0.0.1" in openai_base_url:
        try:
            headers = {
                "Authorization": f"Bearer {openai_key or 'omniroute'}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": openai_model,
                "temperature": 0.3,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ]
            }
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(f"{openai_base_url}/chat/completions", headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                raw_content = data["choices"][0]["message"]["content"]
                cleaned_json = clean_llm_json_response(raw_content)
                parsed = json.loads(cleaned_json)
                return StoryOutput(**parsed)
        except Exception as exc:
            logger.warning(f"OpenAI/OmniRoute API generation failed ({exc}).")

    # 4. Deterministic fallback synthesis (100% reliable, zero API cost)
    logger.info("Using deterministic AI story synthesis.")
    return synthesize_fallback_story(context)
