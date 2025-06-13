-- This is magical.
local __INTEGER_MAP__ = Trait.new("__INTEGER_MAP__", "__INTEGER_MAP__", 0, "__INTEGER_MAP__ Trait Not For Use", false, false);
local function numberToInteger(num)
    if not num or type(num) ~= "number" then
        num = 0
    end
    __INTEGER_MAP__:addXPBoost(Perks.None, num);
    local tempMap = transformIntoKahluaTable(__INTEGER_MAP__:getXPBoostMap());
    return tempMap[Perks.None];
end

local function getXPForPerkLevel(perk, level)
    if not perk or not level then
        return 0
    end
    
    local target = nil;
    for i = 0, PerkFactory.PerkList:size() - 1 do
        local info = PerkFactory.PerkList:get(i);
        if info:getType() == perk then
            target = info;
            break;
        end
    end

    if not target then
        return 0
    end

    return target:getTotalXpForLevel(level);
end

function applyTraitBoostsToPlayer(player, traitName)
    if not player or not instanceof(player, "IsoPlayer") then
        print("Error in applyTraitBoostsToPlayer: invalid player = "..tostring(player));
        return
    end

    -- Remove this bit if you do not want it
    if player:HasTrait(traitName) then
        print("Error in applyTraitBoostsToPlayer: player already has trait: "..tostring(traitName));
        return;    
    else
        player:getTraits():add(traitName);
    end

    if not traitName or type(traitName) ~= "string" then
        print("Error in applyTraitBoostsToPlayer: invalid traitName or player already has trait: "..tostring(traitName));
        return
    end    
    
    local trait = TraitFactory.getTrait(traitName);
    if not trait then
        print("Error in applyTraitBoostsToPlayer: trait "..tostring(traitName).." doesn't exist");
        return
    end

    local playerBoostMap = player:getDescriptor():getXPBoostMap();
    local traitBoostMap = transformIntoKahluaTable(trait:getXPBoostMap());
    local xp = player:getXp();

    for perk, value in pairs(traitBoostMap) do
        -- Add the appropriate value to xp boost based off current value
        local oldBoost = playerBoostMap:get(perk);

        if not oldVal then
            oldBoost = 0;
        end
    
        local newBoost = value:intValue();
        newBoost = math.min(3, oldBoost + newBoost);

        playerBoostMap:put(perk, numberToInteger(newBoost));

        -- Level perk trait-value times and set appropriate experience
        local oldLevel = player:getPerkLevel(perk);
        local oldXP = xp:getXP(perk) - getXPForPerkLevel(perk, oldLevel);

        for i = 0, value:intValue()-1 do
            player:LevelPerk(perk);
        end

        xp:setXPToLevel(perk, player:getPerkLevel(perk));
        xp:AddXPNoMultiplier(perk, oldXP);
    end
end