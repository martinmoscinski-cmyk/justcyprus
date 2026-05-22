import {
  normalizeText,
  normalizeProjectName,
  parsePrice,
  getTagFromItem,
  fallbackImage
} from "./helpers.js";

const SOURCE_URL =
  "https://feeds.pafilia.com/xml2u/Marketing.php";

const getBlock = (text, tag) => {
  return (
    text.match(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
    )?.[1] || ""
  );
};

const getDevelopmentBlocks = (xml) => {
  return (
    xml.match(/<development(?:\s[^>]*)?>[\s\S]*?<\/development>/gi) ||
    []
  );
};

const getPropertyBlocks = (development) => {
  const properties = getBlock(development, "properties");

  return (
    properties.match(/<property(?:\s[^>]*)?>[\s\S]*?<\/property>/gi) ||
    []
  );
};

const getImages = (block) => {
  const links = [
    ...block.matchAll(
      /<link\s+size=["'](?:large|original|small)["'][^>]*>\s*([\s\S]*?)\s*<\/link>/gi