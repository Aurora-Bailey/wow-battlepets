function mysplit(inputstr, sep)
        if sep == nil then
                sep = "%s"
        end
        local t={} ; i=1
        for str in string.gmatch(inputstr, "([^"..sep.."]+)") do
                t[i] = str
                i = i + 1
        end
        return t
end

local UIConfig = CreateFrame("Frame", "KBP_WindowFrame", UIParent, "BasicFrameTemplateWithInset")
UIConfig:SetSize(600, 150)
UIConfig:SetPoint("CENTER", UIParent, "CENTER")
UIConfig.title = UIConfig:CreateFontString(nil, "OVERLAY", "GameFontHighlight")
UIConfig.title:SetPoint("LEFT", UIConfig.TitleBg, "LEFT", 5, 0)
UIConfig.title:SetText("Kais Battle Pets")

UIConfig.loadButton = CreateFrame("Button", nil, UIConfig, "GameMenuButtonTemplate")
UIConfig.loadButton:SetPoint("CENTER", UIConfig, "TOP", 0, -40)
UIConfig.loadButton:SetSize(140, 40)
UIConfig.loadButton:SetText("Load")
UIConfig.loadButton:SetNormalFontObject("GameFontNormalLarge")
UIConfig.loadButton:SetHighlightFontObject("GameFontHighlightLarge")
UIConfig.loadButton:SetScript("OnClick", function ()
  local w = UIConfig.textBox:GetText()
  local x = mysplit(w, '|')
  local z = table.remove(x, 1)
  local y = table.concat(x, '|')
  UIConfig.textBox:SetText(y)
  print(z)
  RunScript(z)
end)

UIConfig.textBox = CreateFrame("EditBox", "KBP_EditBox", UIConfig, "InputBoxTemplate")
UIConfig.textBox:SetPoint("CENTER", UIConfig.loadButton, "BOTTOM", 0, -70)
UIConfig.textBox:SetSize(550, 32)
UIConfig.textBox:SetAutoFocus(false)

UIConfig:Hide()

SLASH_KBP1 = "/kbp"
SlashCmdList["KBP"] = function(msg)
  UIConfig:Show()
end
