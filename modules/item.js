export class afmbeItem extends Item {

    async prepareData() {
        super.prepareData()

        // Get the Item's data & Actor's data
        const itemData = this.system
        const actorData = this.actor ? this.actor.system : {}

        // Prepare Data based on item type
        if (itemData && actorData) {
            switch (this.type) {
                case 'item':
                    this._prepareItem(actorData, itemData)
                    break

                case 'quality':
                case 'drawback':
                    this._prepareQualityDrawback(actorData, itemData)
                    break

                case 'aspect':
                    this._prepareAspect(actorData, itemData)
                    break

                case 'skill':
                case 'power':
                    this._prepareSkillPower(actorData, itemData)
                    break

                case 'weapon':
                    this._prepareWeaponItem(actorData, itemData)
                    break
            }
        }
    }

    _prepareItem(actorData, itemData) {




        actorData.descriptionHTML = TextEditor.enrichHTML(itemData.description, {
          secrets: false,
          async: true
        });
  
  
  
  
  
    }

    _prepareQualityDrawback(actorData, itemData) {




        actorData.descriptionHTML = TextEditor.enrichHTML(itemData.description, {
          secrets: false,
          async: true
        });
  
  
  
  
  
    }

    _prepareAspect(actorData, itemData) {




        actorData.descriptionHTML = TextEditor.enrichHTML(itemData.description, {
          secrets: false,
          async: true
        });
  
  
  
  
  
    }

    _prepareSkillPower(actorData, itemData) {




        actorData.descriptionHTML = TextEditor.enrichHTML(itemData.description, {
          secrets: false,
          async: true
        });
  
  
  
  
  
    }

    _prepareWeaponItem(actorData, itemData) {




        actorData.descriptionHTML = TextEditor.enrichHTML(itemData.description, {
          secrets: false,
          async: true
        });
  
  
  
  
  
        // Build Damage String by combining Damage Entry with Damage Multiplier Entry (Looks at Actor to grab Multiplier Value)
        // This does not apply to weapons on vehicles
        if (itemData.damage_cha_multiplier != "none" && this.isEmbedded && this.actor.type != 'vehicle') {
            console.log(this.actor.type)
            itemData.damage_string = `${itemData.damage}*${actorData[itemData.damage_cha_multiplier].value + (itemData.damage_type == 1 ? 1 : 0)}`
        }
        else  {
            itemData.damage_string = itemData.damage
        }
    }
}
