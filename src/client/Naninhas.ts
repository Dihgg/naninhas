
import * as Events from "@asledgehammer/pipewrench-events";

import { Naninhas } from "@client/components/Naninhas";

Events.onCreatePlayer.addListener((_, player) => {
	new Naninhas(player);
});
