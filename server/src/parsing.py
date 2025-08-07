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
        model_name="claude-3-5-haiku-latest",
        provider=AnthropicProvider(api_key=settings.anthropic_api_key),
    ),
    output_type=BaseRecipeCreate,
    system_prompt=f"""
    You are a recipe extraction expert. Given the content of a webpage,
    extract the recipe information and format it as requested.

    For the steps, break down the cooking instructions into clear,
    numbered steps. If no clear author is found, use "Unknown" as the author.

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


async def markdown_to_recipe(markdown: str) -> BaseRecipeCreate:
    binary_io = io.BytesIO(markdown.encode("utf-8"))

    md = MarkItDown()
    content = md.convert_stream(binary_io).markdown

    prompt = f"Extract the recipe from the following webpage content:\n\n{content}"

    return (await recipe_agent.run(prompt, output_type=BaseRecipeCreate)).output


async def image_to_recipe(image_bytes: bytes) -> BaseRecipeCreate:
    prompt = "Extract the recipe from the following image."

    return (
        await recipe_agent.run(
            [prompt, BinaryContent(image_bytes, media_type="image/jpeg")],
            output_type=BaseRecipeCreate,
        )
    ).output
