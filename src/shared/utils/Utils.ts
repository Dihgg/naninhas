import { getCore } from "@asledgehammer/pipewrench";

/**
 * Get the game version
 * @return The major and minor version of the game
 */
export const getVersion = () => {
	const version = getCore().getVersionNumber();
	const [ major, minor ] = string.match(version, "(%d+)%.(%d+)");
	return { major: +major, minor: +minor };
};