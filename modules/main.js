// Import Modules
import { afmbeActorSheet } from "./actor-sheet.js";
import { afmbeActor } from "./actor.js";
import { afmbeItem } from "./item.js";
import { afmbeItemSheet } from "./item-sheet.js";
import { afmbeCreatureSheet } from "./creature-sheet.js"
import { afmbeVehicleSheet } from "./vehicle-sheet.js"
import { registerHandlebarsHelpers } from "./helpers.js";


/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
    console.log(`Initializing CONX System`);

    /**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
        formula: "1d10 + @initiative.value",
        decimals: 0
      };

            
      // Register Handlebars Helpers
      registerHandlebarsHelpers();


      // Define Custom Entity Classes
      CONFIG.Actor.documentClass = afmbeActor
      CONFIG.Item.documentClass = afmbeItem

      // Register sheet application classes
      Actors.unregisterSheet("core", ActorSheet)

      Actors.registerSheet("afmbe", afmbeActorSheet, 
      {
          types: ["character"],
          makeDefault: true,
          label: "Default CONX Character Sheet"
      })

      Actors.registerSheet("afmbe", afmbeCreatureSheet, 
      {
          types: ["creature"],
          makeDefault: true,
          label: "Default CONX Creature Sheet"
      })

      Actors.registerSheet("afmbe", afmbeVehicleSheet, 
      {
          types: ["vehicle"],
          makeDefault: true,
          label: "Default CONX Vehicle Sheet"
      })

      Items.registerSheet("afmbe", afmbeItemSheet, 
      {
          makeDefault: true,
          label: "Default CONX Item Sheet"
      })


      // Game Settings
      function delayedReload() {window.setTimeout(() => location.reload(), 500)}


      game.settings.register("afmbe", "light-mode", {
        name: game.i18n.localize("AFMBE.Light Mode"),
        hint: game.i18n.localize("AFMBE.Checking this option enables Light Mode"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        onChange: delayedReload
      });
      
})

/* -------------------------------------------- */
/*  Chat Message Hooks                          */
/* -------------------------------------------- */

// Hook for Re-Rolls on Lucky/Unlucky Rolls
Hooks.on("renderChatMessage", (app, html, data) => {
    let chatButton = html[0].querySelector("[data-roll='roll-again']")

    if (chatButton != undefined && chatButton != null) {
        chatButton.addEventListener('click', async () => {
            let ruleTag = ''

            if (html[0].querySelector("[data-roll='dice-result']").textContent == 10) {ruleTag = game.i18n.localize("AFMBE.Rule of Ten Re-Roll")}
            if (html[0].querySelector("[data-roll='dice-result']").textContent == 1)  {ruleTag = game.i18n.localize("AFMBE.Rule of One Re-Roll")}

            let roll = new Roll('1d10')
            await roll.roll()
            await game?.dice3d?.showForRoll(roll)

            // Grab and Set Values from Previous Roll
            let attributeLabel = html[0].querySelector('h2').outerHTML
            let diceTotal = Number(html[0].querySelector("[data-roll='dice-total']").textContent)
            let rollMod = Number(html[0].querySelector("[data-roll='modifier']").textContent)
            let ruleOfMod = ruleTag === game.i18n.localize("AFMBE.Rule of Ten Re-Roll") ? Number(roll.result) > 5 ? Number(roll.result) - 5 : 0 : Number(roll.result) > 5 ? 0 : Number(roll.result) - 5
            let ruleOfDiv = ''

            if (roll.result == 10) {
                ruleOfDiv = `<h2 class="rule-of-chat-text">`+game.i18n.localize("AFMBE.Rule of 10!")`</h2>
                            <button type="button" data-roll="roll-again" class="rule-of-ten">`+game.i18n.localize(`AFMBE.Roll Again`)`</button>`
                ruleOfMod = 5
            }
            if (roll.result == 1) {
                ruleOfDiv = `<h2 class="rule-of-chat-text">`+game.i18n.localize("AFMBE.Rule of 1!")`</h2>
                            <button type="button" data-roll="roll-again" class="rule-of-one">`+game.i18n.localize(`AFMBE.Roll Again`)`</button>`
                ruleOfMod = -5
            }

            // Create Chat Content
            let tags = [`<div>${ruleTag}</div>`]
            let chatContent = `<form>
                                    ${attributeLabel}

                                    <table class="afmbe-chat-roll-table">
                                        <thead>
                                            <tr>
                                                <th>`+game.i18n.localize(`AFMBE.Roll`)+`</th>
                                                <th>`+game.i18n.localize(`AFMBE.Modifier`)+`</th>
                                                <th>+</th>
                                                <th>`+game.i18n.localize(`AFMBE.Result`)+`</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td data-roll="dice-result">[[${roll.result}]]</td>
                                                <td data-roll="modifier">${rollMod}</td>
                                                <td>+</td>
                                                <td data-roll="dice-total">${diceTotal + ruleOfMod}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%;">
                                        ${ruleOfDiv}
                                    </div>
                                </form>`

            ChatMessage.create({
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                user: game.user.id,
                speaker: ChatMessage.getSpeaker(),
                flavor: `<div class="afmbe-tags-flex-container">${tags.join('')}</div>`,
                content: chatContent,
                roll: roll
            })
        })
    }
})