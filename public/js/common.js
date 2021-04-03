export function getCustomFields(cardJson, items, fieldsModel) {
  let json = {};

  // Process custom field items
  for (let i = 0; i < items.length; i ++) {

    // Find custom field model
    const model = fieldsModel.filter(model => model.id == items[i].idCustomField);
    const name = model[0].name;

    if (items[i].value) {

      // Direct value
      const value = Object.values(items[i].value)[0];
      json[name] = value;

    } else {

      // Get value from options
      const value = Object.values(model[0].options.filter(model => model.id == items[i].idValue)[0].value)[0];
      json[name] = value;

    }

  }

  // Get custom field ids and values
  for (let i = 0; i < fieldsModel.length; i ++) {
    const name = fieldsModel[i].name;
    const customFieldId = "idCustomField" + name;
    json.[customFieldId] = fieldsModel[i].id;

    for (let j = 0; j < (fieldsModel[i].options ? fieldsModel[i].options.length : 0); j ++) {
      const idValue = fieldsModel[i].options[j].id;
      const value = fieldsModel[i].options[j].value.text;
      const customFieldIdValue = "idCustomFieldValue" + name + value;
      json.[customFieldIdValue] = idValue;
    }

  }

  return json;
}