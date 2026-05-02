import base64
import io
import json
import re
from typing import cast

import anthropic
from aiohttp import ClientSession
from bs4 import BeautifulSoup
from markitdown import MarkItDown

from src.schemas import BaseRecipeCreate
from src.settings import settings

client = anthropic.AsyncAnthropic(
    api_key=settings.anthropic_api_key.get_secret_value()
)

SYSTEM_PROMPT = f"""
You are a recipe extraction expert. Given the content of a webpage, a cookbook recipe, or a manually entered recipe,
extract the recipe information and format it as requested.

For the time estimate, use whatever is provided. If the recipe provides multiple time estimates but one of them is "active time", you should use the active time as your time estimate.

For the ingredients, separate each ingredient into the name, quantity, and units.
For the instructions, separate each step into a step number and the full content of the step, including any sub-steps, subtitles, or notes.

For the cuisine, make the best guess you can based on the content of the recipe. The cuisine should be something like Japanese, Italian, etc. "Vegan" or "Vegetarian" are not cuisines, but dietary restrictions. You can also use those as tags.

The tags should be a list of strings that are relevant to the recipe, such as "quick", "winter", "family-friendly", "vegan", etc., and can also highlight specific ingredients. These should be derived from the content of the recipe.

The type should be an enum value of `type` which best describes the recipe.

The meal should be an enum value of `meal` which best describes the recipe.

You must return the result as a JSON object matching the BaseRecipeCreate schema, which looks like this:

{BaseRecipeCreate.model_json_schema()}

Return ONLY the JSON object, no markdown fences or other text.
"""


async def _parse_response(text: str) -> BaseRecipeCreate | None:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        data = json.loads(cleaned)
        result = BaseRecipeCreate.model_validate(data)
    except (json.JSONDecodeError, ValueError):
        return None

    return await agent_result_to_maybe_recipe(result)


async def extract_recipe_markdown_from_url(url: str) -> str:
    async with ClientSession() as session, session.get(url) as response:
        html = await response.text()

    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(
        [
            "script",
            "style",
            "svg",
            "img",
            "picture",
            "video",
            "meta",
            "head",
            "iframe",
            "footer",
            "head",
            "meta",
            "nav",
            "noscript",
            "form",
            "input",
            "button",
            "aside",
            "link",
            "figure",
            "figcaption",
            "canvas",
            "dialog",
        ]
    ):
        tag.decompose()

    js_patterns = [
        "function()",
    ]

    for pattern in js_patterns:
        for element in soup.find_all(string=re.compile(pattern, re.I)):
            element.decompose()

    return cast(str, soup.prettify())


async def agent_result_to_maybe_recipe(
    result: BaseRecipeCreate,
) -> BaseRecipeCreate | None:
    if "unknown" in result.name.lower():
        return None

    if not result.name or not result.ingredients or not result.instructions:
        return None

    return result


async def markdown_to_recipe(markdown: str) -> BaseRecipeCreate | None:
    binary_io = io.BytesIO(markdown.encode("utf-8"))

    md = MarkItDown()
    content = md.convert_stream(binary_io).markdown

    prompt = f"Extract the recipe from the following webpage content:\n\n{content}"

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text  # type: ignore[union-attr]
    return await _parse_response(text)


async def image_to_recipe(images: list[bytes]) -> BaseRecipeCreate | None:
    content: list[anthropic.types.ImageBlockParam | anthropic.types.TextBlockParam] = [
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": base64.b64encode(image).decode("utf-8"),
            },
        }
        for image in images
    ]
    content.append({"type": "text", "text": "Extract the recipe from the following image."})

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    text = response.content[0].text  # type: ignore[union-attr]
    return await _parse_response(text)
