import io
import re
from typing import cast

from aiohttp import ClientSession
from bs4 import BeautifulSoup
from markitdown import MarkItDown
from pydantic_ai import Agent, BinaryContent
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.providers.anthropic import AnthropicProvider

from src.schemas import BaseRecipeCreate
from src.settings import settings

recipe_agent = Agent(
    model=AnthropicModel(
        model_name="claude-sonnet-4-0",
        provider=AnthropicProvider(api_key=settings.anthropic_api_key),
    ),
    output_type=BaseRecipeCreate,
    system_prompt=f"""
    You are a recipe extraction expert. Given the content of a webpage, a cookbook recipe, or a manually entered recipe,
    extract the recipe information and format it as requested.

    For the ingredients, separate each ingredient into the name, quantity, and units.
    For the instructions, separate each step into a step number and the full content of the step, including any sub-steps, subtitles, or notes.

    For the cuisine, make the best guess you can based on the content of the recipe. The cuisine should be something like Japanese, Italian, etc. "Vegan" or "Vegetarian" are not cuisines, but dietary restrictions. You can also use those as tags.

    The tags should be a list of strings that are relevant to the recipe, such as "quick", "winter", "family-friendly", "vegan", etc., and can also highlight specific ingredients. These should be derived from the content of the recipe.

    The type should be an enum value of `type` which best describes the recipe.

    The meal should be an enum value of `meal` which best describes the recipe.

    You must return the result as a JSON object matching the BaseRecipeCreate schema, which looks like this:

    {BaseRecipeCreate.model_json_schema()}
    """,
)


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

    result = (await recipe_agent.run(prompt, output_type=BaseRecipeCreate)).output

    return await agent_result_to_maybe_recipe(result)


async def image_to_recipe(image_bytes: bytes) -> BaseRecipeCreate | None:
    prompt = "Extract the recipe from the following image."

    result = (
        await recipe_agent.run(
            [prompt, BinaryContent(image_bytes, media_type="image/jpeg")],
            output_type=BaseRecipeCreate,
        )
    ).output

    return await agent_result_to_maybe_recipe(result)
