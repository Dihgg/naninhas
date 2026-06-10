import { getScriptManager } from "@asledgehammer/pipewrench";
import { PlushieNames } from "@constants";

/**
 * Authentic Z module ids that can provide plushie script items.
 *
 * We patch all known variants so tooltip behavior is consistent regardless
 * of which Authentic Z package the user enabled.
 */
const AUTHENTIC_Z_MODULES = ["AuthenticZClothing", "AuthenticZBackpacksPlus", "AuthenticZLite"] as const;

/**
 * Applies Naninhas tooltip localization keys to Authentic Z plushie script
 * items at client startup.
 */
export class TooltipPatcher {
    /**
     * Creates the patcher and immediately applies tooltip params.
     *
     * @param scriptManager - Optional injected script manager for tests.
     */
    constructor(
        private readonly scriptManager = getScriptManager()
    ) {
        this.applyTooltips();
    }

    /**
     * Iterates known plushies across Authentic Z modules and sets each script
     * item's `Tooltip` param to the translation key expected by Naninhas.
     */
    private applyTooltips() {
        for (const plushieName of Object.values(PlushieNames)) {
            for (const moduleName of AUTHENTIC_Z_MODULES) {
                const fullType = `${moduleName}.${plushieName}`;
                const scriptItem = this.scriptManager.getItem(fullType);
                scriptItem?.DoParam(`Tooltip = Tooltip_${plushieName}`);
            }
        }
    }
}