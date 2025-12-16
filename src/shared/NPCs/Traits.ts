
import { Traits } from "@shared/components/Traits";
import { getVersion } from "@shared/utils";

const { major } = getVersion();

print(`[Naninhas] Game version is: ${major}`);


/**
 * In Build 42 the way of creating Traits is different, so we only need to call the Traits
 * on build 41
 */
if (major < 42) new Traits();
