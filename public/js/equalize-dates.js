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

// Calculate dates
const setDates = (json) => {
  let putJson = {};

  // Set standard start date the same as custom field start date
  if (json.customFields["Start date"] && (json.start != json.customFields["Start date"])) {
    json.start = json.customFields["Start date"];

    putJson.main = {
      params : {
        start : JSON.parse(JSON.stringify(json.start))
      }
    };

  }

  // Set first custom field date the same as custom field next action
  putJson.checkListItems = [];

  if (json.checkListItems.length > 0) {

    if (json.customFields["Next action"] && (json.checkListItems[0].due != json.customFields["Next action"])) {
      json.checkListItems[0].due = json.customFields["Next action"];
  
      putJson.checkListItems.push({
        id : json.checkListItems[0].id,
        params : {
          due : JSON.parse(JSON.stringify(json.checkListItems[0].due))
        }
      })
  
    }
  
  }

  return putJson;
}

// Success on putting new start date
const startDateSuccess = (response) => {
  const newStart = new Intl.DateTimeFormat('default', {dateStyle: 'short', timeStyle: 'long'}).format(new Date(response.start));
  $("#response").append(`<sm>Start date: ${newStart}<br></sm>`);
  $("#response").show();
}

// Failure on put request
const requestFailure = (response) => {
  $("#response").append(`<sm><red>Error ${response.status} - ${response.responseText}<br></red></sm>`);
}

// Success on putting new check list item due date
const checkListSuccess = (response) => {
  const newDue = new Intl.DateTimeFormat('default', {dateStyle: 'short', timeStyle: 'long'}).format(new Date(response.due));
  $("#response").append(`<sm>${response.name}: ${newDue}<br></sm>`);
  $("#response").show();
}

// Equalize dates
const equalize = (t, token) => {

  t.card('id')
    .then((card) => {
      window.Trello.setToken(token);

      try {

        window.Trello.cards.get(card.id, {
          customFields: 'true',
          customFieldItems: 'true',
          checklists: 'all'
        })
          .then((card) => {

            // Calculate new dates
            let work = {};
            work.start = card.start;
            work.customFields = (card.customFieldItems && card.customFields) ? getCustomFields(card.customFieldItems, card.customFields) : {};
            work.checkListItems = card.checklists ? getCheckListItems(card.checklists) : {};
            const output = setDates(work);

            // Start updates
            let response = [];

            // Update main fields
            if (output.main) {
              window.Trello.put(`card/${card.id}`, output.main.params, startDateSuccess, requestFailure);
            }

            // Update check list items
            for(let i = 0; i < output.checkListItems.length; i ++) {
              window.Trello.put(`card/${card.id}/checkItem/${output.checkListItems[i].id}`, output.checkListItems[i].params, checkListSuccess, requestFailure);
            }

            //Nothing to update
            if (!output.main && output.checkListItems.length === 0) {
              $("#response").append(`<sm>Nothing to update!<br></sm>`);
              $("#response").show();            
            }

          })

      } catch(err) {
        console.log(err);
      }

    })

}