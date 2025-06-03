import * as Events from "@asledgehammer/pipewrench-events";

import { NaninhaClass } from "components";


Events.onCreatePlayer.addListener((_, player) => {
	const naninhas = new NaninhaClass(player);
});