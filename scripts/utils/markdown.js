const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const md = new MarkdownIt({
	html: false,
	linkify: false,
	typographer: false
});

/**
 * Render inline markdown-it tokens to Steam BBCode.
 * @param {import("markdown-it/lib/token")[]} children
 * @returns {string}
 */
const renderInlineTokens = children => {
	let out = "";

	for (const child of children) {
		switch (child.type) {
			case "text":
				out += child.content;
				break;
			case "strong_open":
				out += "[b]";
				break;
			case "strong_close":
				out += "[/b]";
				break;
			case "em_open":
				out += "[i]";
				break;
			case "em_close":
				out += "[/i]";
				break;
			case "link_open": {
				const href = child.attrGet("href") ?? "";
				out += `[url=${href}]`;
				break;
			}
			case "link_close":
				out += "[/url]";
				break;
			case "image": {
				const src = child.attrGet("src") ?? "";
				out += `[img]${src}[/img]`;
				break;
			}
			case "code_inline":
				out += `[code]${child.content}[/code]`;
				break;
			case "softbreak":
			case "hardbreak":
				out += " ";
				break;
			default:
				break;
		}
	}

	return out;
};

/**
 * Convert Markdown body to Steam BBCode description.
 * @param {string} markdown
 * @returns {string}
 */
const markdownToBbcode = markdown => {
	const tokens = md.parse(markdown, {});
	let out = "";
	const headingStack = [];

	for (const token of tokens) {
		switch (token.type) {
			case "heading_open": {
				const level = Number(token.tag.replace("h", "")) || 2;
				headingStack.push(level);
				out += `[h${level}]`;
				break;
			}
			case "heading_close": {
				const level = headingStack.pop() ?? 2;
				out += `[/h${level}] `;
				break;
			}
			case "hr":
				out += "[hr][/hr] ";
				break;
			case "bullet_list_open":
				out += "[list] ";
				break;
			case "bullet_list_close":
				out += "[/list] ";
				break;
			case "ordered_list_open":
				out += "[list] ";
				break;
			case "ordered_list_close":
				out += "[/list] ";
				break;
			case "list_item_open":
				out += "[*]";
				break;
			case "list_item_close":
				out += " ";
				break;
			case "inline":
				out += renderInlineTokens(token.children ?? []);
				break;
			case "code_block":
			case "fence":
				out += `[code]${token.content}[/code] `;
				break;
			case "paragraph_close":
				out += " ";
				break;
			default:
				break;
		}
	}

	return out.replace(/\s+/g, " ").trim();
};

/**
 * Extract an array that can be used by Workshop
 * @param {string} value
 * @returns {string}
 */
const extractWorkshopArray = value => {
	return value
		.split(",")
		.map(item => String(item).trim())
		.filter(Boolean)
		.join(";");
};

/**
 * @typedef { Record<string, string | number | boolean | string[]> } Extracted
 */
/**
 * 
 * @param {string} markdownPath 
 * @param {Record<string, "string" | "number" | "boolean" | "array">} schema 
 * @return {{ extracted: Extracted, content: string }}
 */
const extractFrontMatterData = (markdownPath, schema) => {
    /** @type {Extracted} */
    const extracted = {};
    const { data, content } = matter(markdownPath);
    for (const [key, type] of Object.entries(schema)) {
        switch (type) {
            case "string":
            case "number":
                extracted[key] = ["string", "number"].includes(typeof data[key]) ? String(data[key]).trim() : "";
                break;
            case "boolean":
                extracted[key] = typeof data[key] === "boolean" ? Boolean(data[key]) : false;
                break;
            case "array":
                extracted[key] = extractWorkshopArray(data[key]);
                break;
            default:
                extracted[key] = null;
                break;
        }
    }
    return { extracted, content };
}

module.exports = {
	markdownToBbcode,
	extractFrontMatterData
};