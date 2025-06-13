function applyTraitBoostsToPlayer(player, traitName)
    if not player or not instanceof(player, "IsoPlayer") then
        print("Error in applyTraitBoostsToPlayer: invalid player = "..tostring(player));
        return
    end
    
    if not traitName or type(traitName) ~= "string" or player:HasTrait(traitName) then
        print("Error in applyTraitBoostsToPlayer: invalid traitName or player already has trait: "..tostring(traitName));
        return
    end    
    
    local trait = TraitFactory.getTrait(traitName);
    if not trait then
        print("Error in applyTraitBoostsToPlayer: trait "..tostring(traitName).." doesn't exist");
        return
    end


    -- Get existing perks from the player xpBoostMap for caching
    local xpBoostMap = transformIntoKahluaTable(player:getDescriptor():getXPBoostMap());
    local cachedPerks = {};
    local xp = player:getXp();
    
    -- Cache old perk/xp values and set the perk level to 0
    for perk, value in pairs(xpBoostMap) do
        local oldValues = {};
        oldValues.level = player:getPerkLevel(perk);

        local totalXP = xp:getXP(perk);
        local levelXP = getXPForPerkLevel(perk, oldValues.level);
        oldValues.xp = totalXP - levelXP;

        -- Value here is actually java.lang.Integer so convert it
        oldValues.boost = value:intValue();

        cachedPerks[perk] = oldValues;

        player:level0(perk);
    end

    -- Add trait to the player via applyTraits. This applies XP boost and appropriate levels
    local traitList = ArrayList.new();
    traitList:add(traitName);
    player:applyTraits(traitList);

    -- Add back old perk levels and XP from cached values
    for perk, oldValues in pairs(cachedPerks) do
        local curLevel = player:getPerkLevel(perk);
        local oldLevel = oldValues.level;
        local oldBoost = oldValues.boost;

        local targetLevel = oldLevel + curLevel - oldBoost;

        -- counteracts applyTraits() str/fit +5
        if perk == Perks.Strength or perk == Perks.Fitness then
            targetLevel = targetLevel - 5;
        end
        
        if targetLevel > curLevel then
            for i = curLevel, targetLevel do
                player:LevelPerk(perk);
            end
        elseif targetLevel < curLevel then
            for i = curLevel, targetLevel+1, -1 do
                player:LoseLevel(perk);
            end            
        end
        
        xp:setXPToLevel(perk, player:getPerkLevel(perk));
        xp:AddXPNoMultiplier(perk, oldValues.xp);
    end
end

function getXPForPerkLevel(perk, level)
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