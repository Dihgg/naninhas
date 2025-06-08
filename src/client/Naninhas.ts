import * as Events from "@asledgehammer/pipewrench-events";

import { Naninhas } from "./components/NaninhasClass";


Events.onCreatePlayer.addListener((_, player) => {
	new Naninhas(player);
});
