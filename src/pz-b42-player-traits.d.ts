/**
 * Build 42 runtime globals used by CharacterTraitApi.
 * These are optional so Build 41 remains type-safe.
 */

export {};

declare global {
	var CharacterTrait: PzCharacterTraitStaticApi | undefined;
	var ResourceLocation: PzResourceLocationStaticApi | undefined;
}
