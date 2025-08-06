import io
import re
from typing import cast

from aiohttp import ClientSession
from bs4 import BeautifulSoup
from markitdown import MarkItDown
from pydantic_ai import Agent
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


async def extract_recipe_from_url(url: str) -> BaseRecipeCreate:
    async with ClientSession() as session, session.get(url) as response:
        html = await response.text()

    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(
        [
            "script",
            "style",
            "a",
            "nav",
            "footer",
            "form",
            "input",
            "button",
            "noscript",
            "svg",
            "img",
            "picture",
            "video",
            "source",
            "link",
            "meta",
            "head",
            "iframe",
        ]
    ):
        tag.decompose()

    js_patterns = [
        "function()",
    ]

    for pattern in js_patterns:
        for element in soup.find_all(string=re.compile(pattern, re.I)):
            element.decompose()
    binary_io = io.BytesIO(cast(bytes, soup.prettify(encoding="utf-8")))

    md = MarkItDown()
    content = md.convert_stream(binary_io).markdown

    prompt = f"Extract the recipe from the following webpage content:\n\n{content}"

    return (await recipe_agent.run(prompt, output_type=BaseRecipeCreate)).output
