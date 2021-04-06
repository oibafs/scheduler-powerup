// Calculate difference between two dates in days
const dateDiff = (originalDate, futureDate) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((futureDate - originalDate) / _MS_PER_DAY);
}

// Get days until the next occurrence of the repeating card
const daysUntilRepeat = (originalDate, recurring, recPeriod) => {
  let future = new Date(originalDate);

  switch (recPeriod) {

    case "days":
      return recurring;
      break;

    case "weeks":
      return (recurring * 7);
      break;

    case "months":
      future.setUTCMonth(future.getUTCMonth() + recurring);
      return dateDiff(originalDate, future);
      break;

    case "years":
      future.setUTCFullYear(future.getUTCFullYear() + recurring);
      return dateDiff(originalDate, future);
      break;

  }

}

// Set number of days to postpone according to card priority
const setDaysPostponable = (daysPostponable, priority, recurring) => {
  let days;

  if(daysPostponable) {
    days = parseInt(daysPostponable);
  } else {

    switch(priority) {

      case "Urgent":
        days = 1;
        break;

      case "Important":
        days = 2;
        break;

      case "Medium":
        days = 3;
        break;

      default:
        days = 4;
        break;

    }
  }

  if (days > recurring && recurring != 0) {
    days = recurring;
  }

  return days;
}

// Add a number of days to a date, considering all rules
const addDays = (originalDate, daysToAdd, actionDays, today) => {
  let futureDay = new Date(originalDate);

  if (daysToAdd == 0) {
    return futureDay;
  }

  let i = 0;

  do {
    i ++;

    futureDay.setUTCDate(futureDay.getUTCDate() + 1);
    let dayOfWeek = futureDay.getUTCDay();

    switch(actionDays) {

      case "Workdays":

        while (dayOfWeek == 0 || dayOfWeek == 6) {
          futureDay.setUTCDate(futureDay.getUTCDate() + 1);
          dayOfWeek = futureDay.getUTCDay();
        };
    
        break;

      case "Weekends":

        while (dayOfWeek != 0 && dayOfWeek != 6) {
          futureDay.setUTCDate(futureDay.getUTCDate() + 1);
          dayOfWeek = futureDay.getUTCDay();
        };

        break;

      case "Days off":

        while (dayOfWeek != 6) {
          futureDay.setUTCDate(futureDay.getUTCDate() + 1);
          dayOfWeek = futureDay.getUTCDay();
        };

        break;
          
      default:
        break;

    };

  }
  while (i < daysToAdd || futureDay < today);

  return futureDay;
}

// Calculate dates to postpone card
const postponeByRules = (json) => {
  let putJson = {};

  // 1. checklist overdue -> due + postponable (consider action days): if still overdue => today
  const actionDays = json.customFields["Action days"] ? json.customFields["Action days"] : "Any day";
  const recPeriod = json.customFields["Recurring period"] ? json.customFields["Recurring period"] : "days";
  const today = new Date();
  let earlierDate;
  let laterDate;
  putJson.checkListItems = [];

  for (let i = 0; i < json.checkListItems.length; i ++) {
    let dueDate = new Date(json.checkListItems[i].due);
  
    if (dueDate < today) {
      const recurring = daysUntilRepeat(dueDate, json.customFields.Recurring ? parseInt(json.customFields.Recurring) : 0, recPeriod);
      const daysPostponable = setDaysPostponable(json.customFields["Days postponable"], json.customFields.Priority, recurring);
      dueDate = addDays(dueDate, daysPostponable, actionDays, today);
      json.checkListItems[i].due = dueDate;

      putJson.checkListItems.push({
        id : json.checkListItems[i].id,
        params : {
          due : JSON.parse(JSON.stringify(dueDate))
        }
      })
    }

    earlierDate = (dueDate < earlierDate || !earlierDate) ? dueDate : earlierDate;
    laterDate = (dueDate > laterDate || !laterDate) ? dueDate : laterDate;
  }

  // 2. next action -> same date as earlier checklist item
  putJson.customFields = [];

  if (earlierDate) {
    let nextAction = earlierDate;

    if (JSON.stringify(nextAction) != JSON.stringify(json.customFields["Next action"])) {
      json.customFields["Next action"] = nextAction;

      putJson.customFields.push({
        idCustomField : json.customFields["idCustomFieldNext action"],
        body : {
          value : {
            date : JSON.parse(JSON.stringify(json.customFields["Next action"]))
          }
        }
      });
    
    };

  }

  // 3. due date -> if lower than later date => original date + postponable weeks -> if greater than today + recurring => later date
  let due = new Date(json.due);
  let nextRecurrent;

  if ((due < laterDate || !json.due) && laterDate) {
    const recurring = daysUntilRepeat(due, json.customFields.Recurring ? parseInt(json.customFields.Recurring) : 0, recPeriod);
    const daysPostponable = setDaysPostponable(json.customFields["Days postponable"], json.customFields.Priority, recurring);

    if (!json.due) {
      due = laterDate;
    } else {
      nextRecurrent = (recPeriod === "days") ? addDays(due, recurring, actionDays, due) : new Date(due.setUTCDate(due.getUTCDate() + recurring));
      due.setUTCDate(due.getUTCDate() + daysPostponable * 7);
    }

    if (recurring > 0 && nextRecurrent && due > nextRecurrent) {
      due = nextRecurrent;
    }

  }

  if (JSON.stringify(due) != JSON.stringify(json.due)) {
    json.due = due;

    putJson.main = {
      params : {
        due : JSON.parse(JSON.stringify(json.due))
      }
    };
  
  };

  return putJson;
}

// Success on putting new due date
const putDueDateSuccess = (response) => {
  const newDue = new Intl.DateTimeFormat('default', {dateStyle: 'short', timeStyle: 'long'}).format(new Date(response.due));
  $("#response").append(`<sm>Due date: ${newDue}<br></sm>`);
  $("#response").show();
}

// Success on putting new custom field value
const putCustomFieldSuccess = (response) => {
  const newValue = new Intl.DateTimeFormat('default', {dateStyle: 'short', timeStyle: 'long'}).format(new Date(response.value.date));
  $("#response").append(`<sm>Custom field: ${newValue}<br></sm>`);
  $("#response").show();
}

// Failure on putting new custom field value
const putCustomFieldFailure = (text) => {
  $("#response").append(`<sm><red>${text}<br></red></sm>`);
}

// Postpone card
const postponeCard = (id, token) => {

  window.Trello.cards.get(id, {
      customFields: 'true',
      customFieldItems: 'true',
      checklists: 'all'
    }, getCardSuccess, requestFailure)
    .then((card) => {

      // Calculate new dates
      let work = {};
      work.due = card.due;
      work.customFields = (card.customFieldItems && card.customFields) ? getCustomFields(card.customFieldItems, card.customFields) : {};
      work.checkListItems = card.checklists ? getCheckListItems(card.checklists) : {};
      const output = postponeByRules(work);

      // Start updates

      // Update main fields
      if (output.main) {
        window.Trello.put(`card/${card.id}`, output.main.params, putDueDateSuccess, requestFailure);
      }

      // Update custom fields
      for (let i = 0; i < output.customFields.length; i ++) {
        console.log(JSON.stringify(output.customFields[i].body));

        fetch(`https://scheduler-ruby.vercel.app/api/1/trello/cards/${card.id}/customField/${output.customFields[i].idCustomField}/item?key=039f30a96f8f3e440addc095dd42f87d&token=${token}`, {
          method: 'PUT',
          body: JSON.stringify(output.customFields[i].body)
        })
        .then(response => response.text()
        .then(text => {

          if (response.ok) {
            text = JSON.parse(text);
            putCustomFieldSuccess(text);
          } else {
            putCustomFieldFailure(`Error ${response.status} - ${text}`);
          }

        })
        )

      }

      // Update check list items
      for (let i = 0; i < output.checkListItems.length; i ++) {
        window.Trello.put(`card/${card.id}/checkItem/${output.checkListItems[i].id}`, output.checkListItems[i].params, putCheckListSuccess, requestFailure);
      }

      //Nothing to update
      if (!output.main && output.customFields.length === 0 && output.checkListItems.length === 0) {
        $("#response").append(`<sm>Nothing to update!<br></sm>`);
        $("#response").show();            
      }
      
    })

}

// Postpone
const postpone = (t, token) => {

  t.card('id')
    .then((card) => {
      window.Trello.setToken(token);
      postponeCard(card.id, token);
    })
}