-- localized PZ functions
local Events = Events

--- This class will handle the "Naninha" buffs when a plushie is attached to backpack
--- @class NaninhaClass
--- @field player table The player Object
local NaninhaClass = {}
NaninhaClass.__index = NaninhaClass

function NaninhaClass:new()
	local instance = setmetatable({}, NaninhaClass)
	return instance
end

-- TODO: use this function to check if a given item is attached to the player hotbar
function NaninhaClass:hasItemAtached(itemName)
	local player = self.player
	local inventory = player:getInventory()
    local items = inventory:getItems()
    if items then
        for i = 0, items:size() - 1 do
            local item = items:get(i)
			print("Attached slot: " .. tostring(item:getAttachedSlot()))
            if itemName == item:getFullType() then
                return true
            end
        end
    end
    return false
end

--- Event Handlers
NaninhaClass.Events = {}

--- Make sure to instantiate a player for NaninhaClass
--- @param player any
function NaninhaClass.Events:OnCreatePlayer(player)
	self.player = player
end

--- Every Minute the game should check for the buffs
function NaninhaClass.Events:EveryOneMinute()
	print("Every Minute Update!")
	print("Should give buffs if a naninha is equipped")
end

--- This method will register the necessary event handlers
function NaninhaClass.Events:register()
	Events.OnCreatePlayer.Add(function(_, player) self.Events:onCreatePlayer(player) end)
	Events.EveryOneMinute.Add(function() self.Events:EveryOneMinute() end)
end

return NaninhaClass