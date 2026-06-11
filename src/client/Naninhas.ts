import * as Events from "@asledgehammer/pipewrench-events";
import { Naninhas } from "@client/components/Naninhas";
import { TooltipPatcher } from "@client/components/TooltipPatcher";

Events.onGameBoot.addListener(() => {
	new TooltipPatcher();
});

Events.onCreatePlayer.addListener((_, player) => {
	new Naninhas(player);
});