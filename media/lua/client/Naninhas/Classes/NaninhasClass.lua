-- localized PZ functions
local Events = Events

--- This class will handle the "Naninha" buffs when a plushie is attached to backpack
--- @class NaninhaClass
--- @field player table The player Object
--- @field Events table The events table
local NaninhasClass = {}
NaninhasClass.__index = NaninhasClass

function NaninhasClass:new()
	local instance = setmetatable({}, NaninhasClass)
    instance.Plushies = {
        SpiffoSanta = {
            type = "AuthenticZClothing.SpiffoSanta",
            buff = function() print("Apply SpiffoSant Buff here!")  end
        }
    }
    -- instance.Events = {}
	return instance
end

--- Event Handlers

--- Make sure to instantiate a player for NaninhaClass
--- @param player any
function NaninhasClass:OnCreatePlayer(player)
	self.player = player
end

--- This method will check if the item is attached to the player
--- @param itemType string The type of item to check
--- @return boolean True if the item is attached, false otherwise
function NaninhasClass:isAttached(itemType)
    local player = self.player
    local attachedItems = player:getAttachedItems()
    for i=attachedItems:size(),1,-1 do
        local item = attachedItems:get(i-1):getItem()
        if itemType == item:getFullType() then
            return true
        end
    end
    return false
end

--- Every Minute the game should check for the buffs
function NaninhasClass:OnEveryOneMinute()
    -- TODO: check each Plush here, if attached, apply the buff
    print("Naninha buff should be applied")
    print("plushies: " .. tostring(self.Plushies))
    for key, value in ipairs(self.Plushies) do
        print("entered the loop: " .. tostring(key))
        print("entered the loop: " .. tostring(value))
        local plushie = value
        print("plushie: " .. tostring(plushie))
        if self:isAttached(plushie.type) then
            print("entered the if")
            plushie.buff()
        end
    end
    --[[
        for key, item in ipairs(self.Plushies) do
            if self:isAttached(item.name) then
                item.buff()
            end
        end
    ]]
	-- print("Should give buffs if a naninha is equipped")
    -- local isAttached = self:isAttached("AuthenticZClothing.SpiffoSanta")
    -- print("Is attached: " .. tostring(isAttached))
end

--- This method will register the necessary event handlers
function NaninhasClass:register()
	Events.OnCreatePlayer.Add(function(_, player) self:OnCreatePlayer(player) end)
	Events.EveryOneMinute.Add(function() self:OnEveryOneMinute() end)
end

return NaninhasClass
