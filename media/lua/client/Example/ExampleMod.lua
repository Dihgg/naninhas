-- Localized PZ Variables
local Events = Events

Events.EveryOneMinute.Add(function()
	print("This should trigger every Minute!")
end)