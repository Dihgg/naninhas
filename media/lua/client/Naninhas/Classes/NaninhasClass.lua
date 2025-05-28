-- localized PZ functions
local Events = Events

--- This class handles plushie buffs ("Naninhas") when attached to the backpack
--- @class NaninhasClass
--- @field player IsoPlayer The player object
--- @field PLUSHIE_SLOTS table The valid slots to a plushie to be attached to
--- @field Plushies table<string, fun(player: IsoPlayer): void> Mapping of plushie names to their buff functions
local NaninhasClass = {}
NaninhasClass.__index = NaninhasClass
NaninhasClass.PLUSHIE_SLOTS = {
	SpiffoPlushie = 'SpiffoPlushie',
	Doll = 'Doll',
	TeddyBear = 'TeddyBear',
	RubberDuck = 'RubberDuck',
}

NaninhasClass.Plushies = {
	Flamingo = function(player)
		-- Reduces stress slightly
		player:getStats():setStress(player:getStats():getStress() - 0.05)
	end,
	GroguAZ = function(player)
		-- Reduces fatigue
		player:getStats():setFatigue(player:getStats():getFatigue() - 0.05)
	end,
	OtisPug = function(player)
		-- Slight hunger reduction
		player:getStats():setHunger(player:getStats():getHunger() - 0.02)
	end,
	Spiffo = function(player)
		-- Reduces pain slightly
		player:getBodyDamage():setPainReduction(0.05)
	end,
	SpiffoGrey = function(player)
		-- Slight fear reduction (custom implementation needed)
		--[[ player:getStats():setFear(player:getStats():getFear() - 0.03) ]]
	end,
	SpiffoHeart = function(player)
		-- More effective stress relief
		player:getStats():setStress(player:getStats():getStress() - 0.07)
	end,
	SpiffoBlueberry = function(player)
		-- Slight thirst reduction
		player:getStats():setThirst(player:getStats():getThirst() - 0.03)
	end,
	SpiffoCherry = function(player)
		-- Slight hunger reduction
		player:getStats():setHunger(player:getStats():getHunger() - 0.03)
	end,
	SpiffoShamrock = function(player)
		-- Boosts endurance
		player:getStats():setEndurance(player:getStats():getEndurance() + 0.02)
	end,
	SpiffoPlushieRainbow = function(player)
		-- Boosts morale (custom implementation needed)
		--[[ player:getStats():setMorale(player:getStats():getMorale() + 0.05) ]]
	end,
	SpiffoSanta = function(player)
		-- Increases cold resistance
		local bodyDamage = player:getBodyDamage()
		-- bodyDamage
		-- bodyDamage:
		-- player:getStats():setColdResistance(player:getStats():getColdResistance() + 0.1)
	end,
	SubstitutionDoll = function(player)
		-- Lowers stress from cigarettes
		player:getStats():setStressFromCigarettes(player:getStats():getStressFromCigarettes() - 0.05)
	end,
	Doll = function(player)
		-- General stress relief
		player:getStats():setStress(player:getStats():getStress() - 0.04)
	end,
	ToyBear = function(player)
		-- Reduces fear (custom implementation needed)
		--[[ player:getStats():setFear(player:getStats():getFear() - 0.05) ]]
	end,
	ToyBearSmall = function(player)
		-- Lowers unhappiness
		local bodyDamage = player:getBodyDamage()
		bodyDamage:setUnhappynessLevel(bodyDamage:getUnhappynessLevel() - 5)
	end,
	BorisBadger = function(player)
		-- Boosts sanity (custom implementation needed)
		--[[ player:getStats():setSanity(player:getStats():getSanity() + 0.05) ]]
	end,
	JacquesBeaver = function(player)
		-- Slight endurance gain
		player:getStats():setEndurance(player:getStats():getEndurance() + 0.03)
	end,
	FreddyFox = function(player)
		-- Reduces fatigue slightly
		player:getStats():setFatigue(player:getStats():getFatigue() - 0.03)
	end,
	PancakeHedgehog = function(player)
		-- Slight stress reduction
		player:getStats():setStress(player:getStats():getStress() - 0.02)
	end,
	MoleyMole = function(player)
		-- Slight fear reduction (custom implementation needed)
		--[[ player:getStats():setFear(player:getStats():getFear() - 0.02) ]]
	end,
	FluffyfootBunny = function(player)
		-- General stress relief
		player:getStats():setStress(player:getStats():getStress() - 0.05)
	end,
	FurbertSquirrel = function(player)
		-- Small morale boost (custom implementation needed)
		--[[ player:getStats():setMorale(player:getStats():getMorale() + 0.03) ]]
	end
}

--- Creates a new NaninhasClass instance
--- @return NaninhasClass
function NaninhasClass:new()
	local instance = setmetatable({}, NaninhasClass)


	return instance
end

--- Stores player reference when created
--- @param player IsoPlayer
function NaninhasClass:OnCreatePlayer(player)
	self.player = player
end

--[[
	--- Checks if a given plushie is attached in one of the valid plushie slots.
	--- @param itemType string The full type of the item (e.g., "AuthenticZClothing.SpiffoSanta")
	--- @param slots table | nil Valid slots for the plushie to be attached
	--- @return boolean True if the item is currently attached in expected slots
	function NaninhasClass:isAttached(itemType, slots)
		slots = slots or self.PLUSHIE_SLOTS
		local attachedItems = self.player and self.player:getAttachedItems()
		if not attachedItems then return false end
	
		for i = 0, attachedItems:size() - 1 do
			local attachedItem = attachedItems:get(i)
			if attachedItem then
				local location = attachedItem:getLocation()
				local item = attachedItem:getItem()
				local isValidLocataion = location and slots[location]
				local isValidItem = item and (item:getFullType() == itemType) or false
	
				if isValidLocataion and isValidItem then
					return true
				end
			end
		end
	
		return false
	end
]]

--- Periodically checks if a plushie is attached and applies its buff
function NaninhasClass:Update()
	if not self.player then return end
	local attachedItems = self.player:getAttachedItems()
	if not attachedItems then return end

	for _, slot in ipairs(self.PLUSHIE_SLOTS) do
		local item = attachedItems:getItem(slot)
		if item then
			local fullType = item:getFullType()
			local plushieKey = fullType:gsub("AuthenticZClothing%.", "")
			local buffFn = self.Plushies[plushieKey]
			if buffFn then
				buffFn(self.player)
			end
		end
	end
end

--- Registers event handlers for Naninhas
function NaninhasClass:register()
	Events.OnCreatePlayer.Add(function(_, player) self:OnCreatePlayer(player) end)
	Events.EveryTenMinutes.Add(function() self:Update() end)
end

return NaninhasClass
