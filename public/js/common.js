// Success on getting a card
const getCardSuccess = () => {}

// Failure on put request
const requestFailure = (response) => {
  console.log(response);
  $("#response").append(`<sm><red>Error ${response.status} - ${response.responseText}<br></red></sm>`);
}

// Get custom fields of a card
const getCustomFields = (items, fieldsModel) => {
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
    json[customFieldId] = fieldsModel[i].id;

    for (let j = 0; j < (fieldsModel[i].options ? fieldsModel[i].options.length : 0); j ++) {
      const idValue = fieldsModel[i].options[j].id;
      const value = fieldsModel[i].options[j].value.text;
      const customFieldIdValue = "idCustomFieldValue" + name + value;
      json[customFieldIdValue] = idValue;
    }

  }

  return json;
}

// Get check list items of a card
const getCheckListItems = (checkLists, complete) => {
  let jsonItems = [];

  // Process check lists
  for(let i = 0; i < checkLists.length; i ++) {

    // Process check list items
    for(let j = 0; j < checkLists[i].checkItems.length; j ++) {

      // Items incomplete and with due date
      if((checkLists[i].checkItems[j].state === "incomplete" || complete) && checkLists[i].checkItems[j].due) {

        jsonItems.push({
          id: checkLists[i].checkItems[j].id,
          name: checkLists[i].checkItems[j].name,
          due: checkLists[i].checkItems[j].due,
        });
        
      }

    }

  }

  return jsonItems;
}

// Success on putting new check list item due date
const putCheckListSuccess = (response) => {
  const newDue = new Intl.DateTimeFormat('default', {dateStyle: 'short', timeStyle: 'long'}).format(new Date(response.due));
  $("#response").append(`<sm>${response.name}: ${newDue}<br></sm>`);
  $("#response").show();
}
