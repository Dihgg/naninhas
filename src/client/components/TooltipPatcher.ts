import { getScriptManager } from "@asledgehammer/pipewrench";
import { PlushieNames } from "@constants";

/**
 * Applies Naninhas tooltip localization keys to Authentic Z plushie script
 * items at client startup.
 */
export class TooltipPatcher {   

    /**
     * Creates the patcher and immediately applies tooltip params.
     *
     * @param scriptManager - Script manager instance
     * @param AUTHENTIC_Z_MODULES - List of Authentic Z modules to patch
     */
    constructor(
        private readonly scriptManager = getScriptManager(),
        private readonly AUTHENTIC_Z_MODULES = ["AuthenticZClothing", "AuthenticZBackpacksPlus", "AuthenticZLite"]
    ) {
        this.applyTooltips();
    }

    /**
     * Iterates known plushies across Authentic Z modules and sets each script
     * item's `Tooltip` param to the translation key expected by Naninhas.
     */
    private applyTooltips() {
        for (const plushieName of Object.values(PlushieNames)) {
            for (const moduleName of this.AUTHENTIC_Z_MODULES) {
                const fullType = `${moduleName}.${plushieName}`;
                const scriptItem = this.scriptManager.getItem(fullType);
                scriptItem?.DoParam(`Tooltip = Tooltip_${plushieName}`);
            }
        }
    }
}