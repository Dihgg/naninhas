import * as Events from "@asledgehammer/pipewrench-events";

import { Naninhas } from "components";


Events.onCreatePlayer.addListener((_, player) => {
	const naninhas = new Naninhas(player);
});