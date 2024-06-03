export class afmbeActorSheet extends ActorSheet {

    /** @override */
      static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          classes: ["afmbe", "sheet", "actor", `${game.settings.get("afmbe", "light-mode") ? "light-mode" : ""}`],
            width: 800,
            height: 820,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "core"}],
            dragDrop: [{dragSelector: [
            ".item"
            ], 
            dropSelector: null}]
      });
    }
  
    /* -------------------------------------------- */
    /** @override */

    async getData() {
    const data = super.getData(); 
    data.isGM = game.user.isGM;
    data.editable = data.options.editable;
    const actorData = data.system;
    let options = 0;
    let user = this.user;

    data.descriptionHTML = await TextEditor.enrichHTML(data.actor.system.biography, {
        async: false
    })

    this._prepareCharacterItems(data)

    return data
   }

    _prepareCharacterItems(sheetData) {
      const actorData = sheetData.actor

      // Initialize Containers
      const item = [];
      const equippedItem = [];
      const weapon = [];
      const power = [];
      const quality = [];
      const skill = [];
      const drawback = [];

      // Iterate through items and assign to containers
      for (let i of sheetData.items) {
          switch (i.type) {
            case "item": 
                if (i.system.equipped) {equippedItem.push(i)}
                else {item.push(i)}
                break
            
            case "weapon": 
                weapon.push(i)
                break

            case "power": 
                power.push(i)
                break

            case "quality": 
                quality.push(i)
                break

            case "skill": 
                skill.push(i)
                break

            case "drawback": 
                drawback.push(i)
                break
          }
      }

      // Alphabetically sort all items
      const itemCats = [item, equippedItem, weapon, power, quality, skill, drawback]
      for (let category of itemCats) {
          if (category.length > 1) {
              category.sort((a,b) => {
                  let nameA = a.name.toLowerCase()
                  let nameB = b.name.toLowerCase()
                  if (nameA > nameB) {return 1}
                  else {return -1}
              })
          }
      }

      // Assign and return items
      actorData.item = item
      actorData.equippedItem = equippedItem
      actorData.weapon = weapon
      actorData.power = power
      actorData.quality = quality
      actorData.skill = skill
      actorData.drawback = drawback
  }

  get template() {
    const path = "systems/afmbe/templates";
    if (!game.user.isGM && this.actor.limited) return "systems/afmbe/templates/limited-character-sheet.html"; 
    return `${path}/${this.actor.type}-sheet.html`;
  }

  /** @override */
    async activateListeners(html) {
        super.activateListeners(html);

        // Run non-event functions
        this._createCharacterPointDivs()
        this._createStatusTags()

        // Buttons and Event Listeners
        html.find('.attribute-roll').click(this._onAttributeRoll.bind(this))
        html.find('.damage-roll').click(this._onDamageRoll.bind(this))
        html.find('.toggleEquipped').click(this._onToggleEquipped.bind(this))
        html.find('.armor-button-cell button').click(this._onArmorRoll.bind(this))
        html.find('.reset-resource').click(this._onResetResource.bind(this))
        
        // Update/Open Inventory Item
        html.find('.create-item').click(this._createItem.bind(this))

        html.find('.item-name').click( (ev) => {
            const li = ev.currentTarget.closest(".item")
            const item = this.actor.items.get(li.dataset.itemId)
            //////////////////////////////////////////////////////////////////////////////////////////////
            // if(this.actor.permission[game.user.data._id] >= 2||game.user.isGM) {item.sheet.render(true)}
            console.log("ID = ", game.user.id);
            console.log("ID = ", game.user._id);
            console.log("Name = ", game.user.name);
            console.log("Permission ID = ", this.actor.permission[game.user.id]); /// Est-ce correct ?
            console.log("Permission is GM = ", game.user.isGM);
            if(this.actor.permission[game.user._id] >= 2||game.user.isGM) {item.sheet.render(true)} /// Est-ce correct ?
            //////////////////////////////////////////////////////////////////////////////////////////////
            item.update({"data.value": item.system.value})
        })

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = ev.currentTarget.closest(".item");
            this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
        });
    }

    /**
   * Handle clickable rolls.
   * @param event   The originating click event
   * @private
   */

    _createItem(event) {
        event.preventDefault()
        const element = event.currentTarget
        
        let itemData = {
            // name: `New ${element.dataset.create}`,
            name: game.i18n.localize(`AFMBE.New`)+` `+game.i18n.localize(`AFMBE.${element.dataset.create}`),
            type: element.dataset.create,
            cost: 0,
            level: 0
        }
        return Item.create(itemData, {parent: this.actor})
    }

    _createCharacterPointDivs() {
        let actorData = this.actor.system
        let attributesDiv = document.createElement('div')
        let qualityDiv = document.createElement('div')
        let drawbackDiv = document.createElement('div')
        let skillDiv = document.createElement('div')
        let powerDiv = document.createElement('div')
        let characterTypePath = actorData.characterTypes[actorData.characterType]

        // Construct and assign div elements to the headers
        if(characterTypePath != undefined) {
            attributesDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].attributePoints.value} / ${actorData.characterTypeValues[characterTypePath].attributePoints.max}]`
            this.form.querySelector('#attributes-header').append(attributesDiv)

            qualityDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].qualityPoints.value} / ${actorData.characterTypeValues[characterTypePath].qualityPoints.max}]`
            this.form.querySelector('#quality-header').append(qualityDiv)

            drawbackDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].drawbackPoints.value} / ${actorData.characterTypeValues[characterTypePath].drawbackPoints.max}]`
            this.form.querySelector('#drawback-header').append(drawbackDiv)

            skillDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].skillPoints.value} / ${actorData.characterTypeValues[characterTypePath].skillPoints.max}]`
            this.form.querySelector('#skill-header').append(skillDiv)

            powerDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].metaphysicsPoints.value} / ${actorData.characterTypeValues[characterTypePath].metaphysicsPoints.max}]`
            this.form.querySelector('#power-header').append(powerDiv)
        }
    }

    _onAttributeRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let attributeLabel = element.dataset.attributeName
        let actorData = this.actor.system

        // Create options for Qualities/Drawbacks/Skills
        let skillOptions = []
        for (let skill of this.actor.items.filter(item => item.type === 'skill')) {
            let option = `<option value="${skill.id}">${skill.name} ${skill.system.level}</option>`
            skillOptions.push(option)
        }

        let qualityOptions = []
        for (let quality of this.actor.items.filter(item => item.type === 'quality')) {
            let option = `<option value="${quality.id}">${quality.name} ${quality.system.cost}</option>`
            qualityOptions.push(option)
        }

        let drawbackOptions = []
        for (let drawback of this.actor.items.filter(item => item.type === 'drawback')) {
            let option = `<option value="${drawback.id}">${drawback.name} ${drawback.system.cost}</option>`
            drawbackOptions.push(option)
        }

        // Create penalty tags from Resource Loss Status
        let penaltyTags = []
        if (actorData.endurance_points.loss_toggle) {penaltyTags.push(`<div>`+game.i18n.localize(`AFMBE.Endurance Loss`)+` ${actorData.endurance_points.loss_penalty}</div>`)}
        if (actorData.essence.loss_toggle) {penaltyTags.push(`<div>`+game.i18n.localize(`AFMBE.Essence Loss`)+` ${actorData.essence.loss_penalty}</div>`)}
        
        // Create Classes for Dialog Box
        let mode = game.settings.get("afmbe", "light-mode") ? "light-mode" : ""
        let dialogOptions = {classes: ["dialog", "afmbe", mode]}

        // Create Dialog Prompt
        let d = new Dialog({
            title: game.i18n.localize('AFMBE.Attribute Roll'),
            content: `<div class="afmbe-dialog-menu">
                            <h2>`+game.i18n.localize(`AFMBE.${attributeLabel}`)+` `+game.i18n.localize("AFMBE.Roll")+`</h2>

                            <div class="afmbe-dialog-menu-text-box">
                                <div>
                                    <p>`+game.i18n.localize("AFMBE.Apply modifiers")+`</p>
                                    
                                    <ul>
                                        <li>`+game.i18n.localize("AFMBE.Simple Test")+`</li>
                                        <li>`+game.i18n.localize("AFMBE.Difficult Test")+`</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="afmbe-tags-flex-container">
                                ${penaltyTags.join('')}
                            </div>


                            <table>
                                <tbody>
                                    <tr>
                                        <td class="table-bold-text">`+game.i18n.localize("AFMBE.Attribute Test")+`</td>
                                        <td class="table-center-align">
                                            <select id="attributeTestSelect" name="attributeTest">
                                                <option value="Simple">`+game.i18n.localize("AFMBE.Simple")+`</option>
                                                <option value="Difficult">`+game.i18n.localize("AFMBE.Difficult")+`</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">`+game.i18n.localize("AFMBE.Roll Modifier")+`</td>
                                        <td class="table-center-align"><input class="attribute-input" type="number" value="0" name="inputModifier" id="inputModifier"></td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">`+game.i18n.localize("AFMBE.Skills")+`</td>
                                        <td class="table-center-align">
                                            <select id="skillSelect" name="skills">
                                                <option value="None">`+game.i18n.localize("AFMBE.None")+`</option>
                                                ${skillOptions.join('')}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">`+game.i18n.localize("AFMBE.Qualities")+`</td>
                                        <td class="table-center-align">
                                            <select id="qualitySelect" name="qualities">
                                                <option value="None">`+game.i18n.localize("AFMBE.None")+`</option>
                                                ${qualityOptions.join('')}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">`+game.i18n.localize("AFMBE.Drawbacks")+`</td>
                                        <td class="table-center-align">
                                            <select id="drawbackSelect" name="drawbacks">
                                                <option value="None">`+game.i18n.localize("AFMBE.None")+`</option>
                                                ${drawbackOptions.join('')}
                                            </select>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                    </div>`,
            buttons: {
                one: {
                    label: game.i18n.localize("AFMBE.Cancel"),
                    callback: html => console.log('Cancelled')
                },
                two: {
                    label: game.i18n.localize("AFMBE.Roll"),
                    callback: async html => {
                        // Grab the selected options
                        let attributeTestSelect = html[0].querySelector('#attributeTestSelect').value
                        let userInputModifier = Number(html[0].querySelector('#inputModifier').value)
                        let selectedSkill = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#skillSelect').value)
                        let selectedQuality = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#qualitySelect').value)
                        let selectedDrawback = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#drawbackSelect').value)

                        // Set values for options
                        let attributeValue = attributeTestSelect === game.i18n.localize("AFMBE.Simple") ? actorData[attributeLabel.toLowerCase()].value * 2 : actorData[attributeLabel.toLowerCase()].value
                        let skillValue = selectedSkill != undefined ? selectedSkill.system.level : 0
                        let qualityValue = selectedQuality != undefined ? selectedQuality.system.cost : 0
                        let drawbackValue = selectedDrawback != undefined ? selectedDrawback.system.cost : 0
                        let statusPenalties = actorData.endurance_points.loss_penalty + actorData.essence.loss_penalty

                        // Calculate total modifier to roll
                        let rollMod = (attributeValue + skillValue + qualityValue + userInputModifier) - drawbackValue + statusPenalties

                        // Roll Dice
                        let roll = new Roll('1d10')
                        await roll.roll()
                        await game?.dice3d?.showForRoll(roll)

                        // Calculate total result after modifiers
                        let totalResult = Number(roll.result) + rollMod

                        // Create Chat Message Content
                        let tags = [`<div>`+game.i18n.localize(`AFMBE.${attributeTestSelect}`)+` `+game.i18n.localize("AFMBE.Test")+`</div>`]
                        let ruleOfDiv = ``
                        if (userInputModifier != 0) {tags.push(`<div>`+game.i18n.localize("AFMBE.User Modifier")+` ${userInputModifier >= 0 ? "+" : ''}${userInputModifier}</div>`)}
                        if (selectedSkill != undefined) {tags.push(`<div>${selectedSkill.name} ${selectedSkill.system.level >= 0 ? '+' : ''}${selectedSkill.system.level}</div>`)}
                        if (selectedQuality != undefined) {tags.push(`<div>${selectedQuality.name} ${selectedQuality.system.cost >= 0 ? '+' : ''}${selectedQuality.system.cost}</div>`)}
                        if (selectedDrawback != undefined) {tags.push(`<div>${selectedDrawback.name} ${selectedQuality.system.cost >= 0 ? '-' : '+'}${Math.abs(selectedDrawback.system.cost)}</div>`)}

                        if (roll.result == 10) {
                            ruleOfDiv = `<h2 class="rule-of-chat-text">`+game.i18n.localize("AFMBE.Rule of 10!")+`</h2>
                                        <button type="button" data-roll="roll-again" class="rule-of-ten">`+game.i18n.localize("AFMBE.Roll Again")+`</button>`
                            totalResult = 10
                        }
                        if (roll.result == 1) {
                            ruleOfDiv = `<h2 class="rule-of-chat-text">`+game.i18n.localize("AFMBE.Rule of 1!")+`</h2>
                                        <button type="button" data-roll="roll-again" class="rule-of-one">`+game.i18n.localize("AFMBE.Roll Again")+`</button>`
                            totalResult = 0
                        }

                        let chatContent = `<form>
                                                <h2>`+game.i18n.localize(`AFMBE.${attributeLabel}`)+` `+game.i18n.localize("AFMBE.Roll")+` [${actorData[attributeLabel.toLowerCase()].value}]</h2>

                                                <table class="afmbe-chat-roll-table">
                                                    <thead>
                                                        <tr>
                                                            <th>`+game.i18n.localize("AFMBE.Roll")+`</th>
                                                            <th>`+game.i18n.localize("AFMBE.Modifier")+`</th>
                                                            <th>`+game.i18n.localize("AFMBE.Result")+`</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td data-roll="dice-result">[[${roll.result}]]</td>
                                                            <td data-roll="modifier">${rollMod}</td>
                                                            <td data-roll="dice-total">${totalResult}</td>
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
                            flavor: `<div class="afmbe-tags-flex-container">${tags.join('')} ${penaltyTags.join('')}</div>`,
                            content: chatContent,
                            roll: roll
                          })
                        
                    }
                }
            },
            default: 'two',
            close: html => console.log()
        }, dialogOptions)

        d.render(true)
    }

    _onDamageRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let weapon = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        // Create Classes for Dialog Box
        let mode = game.settings.get("afmbe", "light-mode") ? "light-mode" : ""
        let dialogOptions = {classes: ["dialog", "afmbe", mode]}

        // Create Dialog Box
        let d = new Dialog({
            title: game.i18n.localize('AFMBE.Weapon Roll'),
            content: `<div class="afmbe-dialog-menu">

                            <div class="afmbe-dialog-menu-text-box">
                                <p><strong>`+game.i18n.localize("AFMBE.If a ranged weapon")+`</strong>`+game.i18n.localize("AFMBE.select how many shots")+`</p>

                                <p>`+game.i18n.localize("AFMBE.Otherwise, leave default and click roll.")+`</p>
                            </div>

                            <div>
                                <h2>`+game.i18n.localize("AFMBE.Options")+`</h2>
                                <table>
                                    <tbody>
                                        <tr>
                                            <th>`+game.i18n.localize("AFMBE.# of Shots")+`</th>
                                            <td>
                                                <input type="number" id="shotNumber" name="shotNumber" value="0">
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>`+game.i18n.localize("AFMBE.Firing Mode")+`</th>
                                            <td>
                                                <select id="firingMode" name="firingMode">
                                                    <option>`+game.i18n.localize("AFMBE.None/Melee")+`</option>
                                                    <option>`+game.i18n.localize("AFMBE.Semi-Auto")+`</option>
                                                    <option>`+game.i18n.localize("AFMBE.Burst Fire")+`</option>
                                                    <option>`+game.i18n.localize("AFMBE.Auto-Fire")+`</option>
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                    <div>`,

            buttons: {
                one: {
                    label: game.i18n.localize("AFMBE.Cancel"),
                    callback: html => console.log('Cancelled')
                },
                two: {
                    label: game.i18n.localize("AFMBE.Roll"),
                    callback: async html => {
                        // Grab Values from Dialog
                        let shotNumber = html[0].querySelector('#shotNumber').value
                        let firingMode = html[0].querySelector('#firingMode').value

                        let roll = new Roll(weapon.system.damage_string)
                        await roll.roll()
                        await game?.dice3d?.showForRoll(roll)

                        let tags = [`<div>`+game.i18n.localize("AFMBE.Damage Roll")+`</div>`]
                        if (firingMode != game.i18n.localize("AFMBE.None/Melee")) {tags.push(`<div>${firingMode}: ${shotNumber}</div>`)}
                        if (weapon.system.damage_types[weapon.system.damage_type] != 'None') {tags.push(`<div>`+game.i18n.localize(`AFMBE.${weapon.system.damage_types[weapon.system.damage_type]}`)+`</div>`)}

                        // Reduce Fired shots from current load chamber
                        if (shotNumber > 0) {
                            switch (weapon.system.capacity.value - shotNumber >= 0) {
                                case true:
                                    weapon.update({'data.capacity.value': weapon.system.capacity.value - shotNumber})
                                    break

                                case false: 
                                    return ui.notifications.info(game.i18n.localize("AFMBE.You do not have enough ammo loaded to fire")+` ${shotNumber} `+game.i18n.localize("AFMBE.rounds!"))
                            }
                        }

                        // Create Chat Content
                        let chatContent = `<div>
                                                <h2>${weapon.name}</h2>

                                                <table class="afmbe-chat-roll-table">
                                                    <thead>
                                                        <tr>
                                                            <th>`+game.i18n.localize("AFMBE.Damage")+`</th>
                                                            <th>`+game.i18n.localize("AFMBE.Detail")+`</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>[[${roll.result}]]</td>
                                                            <td>${weapon.system.damage_string}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>`

                        ChatMessage.create({
                            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                            user: game.user.id,
                            speaker: ChatMessage.getSpeaker(),
                            flavor: `<div class="afmbe-tags-flex-container-item">${tags.join('')}</div>`,
                            content: chatContent,
                            roll: roll
                        })
                    }
                }
            },
            default: "two",
            close: html => console.log()
        }, dialogOptions)

        d.render(true)
    }

    async _onArmorRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let equippedItem = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        let roll = new Roll(equippedItem.system.armor_value)
        await roll.roll()
        await game?.dice3d?.showForRoll(roll)

        let tags = [`<div>`+game.i18n.localize("AFMBE.Armor Roll")+`</div>`]

        // Create Chat Content
        let chatContent = `<div>
                                <h2>${equippedItem.name}</h2>

                                <table class="afmbe-chat-roll-table">
                                    <thead>
                                        <tr>
                                            <th>`+game.i18n.localize("AFMBE.Result")+`</th>
                                            <th>`+game.i18n.localize("AFMBE.Detail")+`</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>[[${roll.result}]]</td>
                                            <td>${equippedItem.system.armor_value}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>`

        ChatMessage.create({
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            flavor: `<div class="afmbe-tags-flex-container-item">${tags.join('')}</div>`,
            content: chatContent,
            roll: roll
          })
    }

    _onToggleEquipped(event) {
        event.preventDefault()
        let element = event.currentTarget
        let equippedItem = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        switch (equippedItem.system.equipped) {
            case true:
                equippedItem.update({'data.equipped': false})
                break
            
            case false:
                equippedItem.update({'data.equipped': true})
                break
        }
    }

    _onResetResource(event) {
        event.preventDefault()
        let actorData = this.actor.system
        let element = event.currentTarget
        let dataPath = `data.${element.dataset.resource}.value`

        this.actor.update({[dataPath]: actorData[element.dataset.resource].max})
    }

    _createStatusTags() {
        let tagContainer = this.form.querySelector('.tags-flex-container')
        let encTag = document.createElement('div')
        let enduranceTag = document.createElement('div')
        let essenceTag = document.createElement('div')
        let injuryTag = document.createElement('div')
        let actorData = this.actor.system

        // Create Essence Tag and & Append
        if (actorData.essence.value <= 1) {
            essenceTag.innerHTML = `<div>`+game.i18n.localize("AFMBE.Hopeless")+`</div>`
            essenceTag.title = game.i18n.localize('AFMBE.All Tests suffer -3 penalty')
            essenceTag.classList.add('tag')
            tagContainer.append(essenceTag)
        }
        else if (actorData.essence.value <= (actorData.essence.max / 2)) {
            essenceTag.innerHTML = `<div>`+game.i18n.localize("AFMBE.Forlorn")+`</div>`
            essenceTag.title = game.i18n.localize('AFMBE.Mental tests suffer a -1 penalty')
            essenceTag.classList.add('tag')
            tagContainer.append(essenceTag)
        }

        // Create Endurance Tag and & Append
        if (actorData.endurance_points.value <= 5) {
            enduranceTag.innerHTML = `<div>`+game.i18n.localize("AFMBE.Exhausted")+`</div>`
            enduranceTag.title = game.i18n.localize('AFMBE.All Tests suffer -2 penalty')
            enduranceTag.classList.add('tag')
            tagContainer.append(enduranceTag)
        }

        // Create Injury Tag and & Append
        if (actorData.hp.value <= -10) {
            injuryTag.innerHTML = `<div>`+game.i18n.localize("AFMBE.Dying")+`</div>`
            injuryTag.classList.add('tag')
            injuryTag.title = game.i18n.localize('AFMBE.Survival Test required to avoid instant death')
            tagContainer.append(injuryTag)
        }
        else if (actorData.hp.value <= 0) {
            injuryTag.innerHTML = `<div>`+game.i18n.localize("AFMBE.Semi-Conscious")+`</div>`
            injuryTag.classList.add('tag')
            injuryTag.title = game.i18n.localize('AFMBE.Willpower test required to regain consciousness, penalized by the number their HP is below 0')
            tagContainer.append(injuryTag)
        }
        else if (actorData.hp.value <= 5) {
            injuryTag.innerHTML = `<div>`+game.i18n.localize("AFMBE.Severely Injured")+`</div>`
            injuryTag.classList.add('tag')
            injuryTag.title = game.i18n.localize('AFMBE.Most actions suffer -1 through -5 penalty')
            tagContainer.append(injuryTag)
        }

        // Create Encumbrance Tags & Append
        switch (actorData.encumbrance.level) {
            case 1:
                encTag.innerHTML = `<div>`+game.i18n.localize("AFMBE.Lightly Encumbered")+`</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break

            case 2:
                encTag.innerHTML = `<div>`+game.i18n.localize("AFMBE.Moderately Encumbered")+`</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break

            case 3: 
                encTag.innerHTML = `<div>`+game.i18n.localize("AFMBE.Heavily Encumbered")+`</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break
        }
    }

}
