/**
 * Extracts the item name token from a full item name.
 * @param fullName The full item name, typically in the format "ModuleName.ItemName"
 * @returns The extracted item name token
 * @example "AuthenticZClothing.Doll" -> "Doll"
 * @example "AuthenticZBackpacksPlus.Doll" -> "Doll"
 * @example "Doll" -> "Doll"
 */
export function extractItemName(fullName: string) {
	const parts = fullName.split(".");
	return parts[parts.length - 1];
}