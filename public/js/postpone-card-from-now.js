// Success on putting new due date
const putDueDateSuccess = (response) => {
  const newDue = new Intl.DateTimeFormat('default', { dateStyle: 'short', timeStyle: 'long' }).format(new Date(response.due));
  $("#response").append(`<sm>Due date: ${newDue}<br></sm>`);
  $("#response").show();
}

// Calculate new time from now based on working hours
const addWorkingHours = (start, priority = "Low", actionDays = "Any day", sameDay = false) => {
  let businessHours;
  let businessDays;
  let hours;

  switch (actionDays) {
    case "Workdays":
      businessHours = [9, 10, 11, 13, 14, 15, 16, 17];
      businessDays = [1, 2, 3, 4, 5];
      break;
    case "Weekends":
      businessHours = [9, 10, 11, 13, 14, 15, 16, 17];
      businessDays = [6, 0];
      break;
    case "Days off":
      businessHours = [9, 10, 11, 13, 14, 15, 16, 17];
      businessDays = [6];
      break;
    default:
      businessHours = [9, 10, 11, 13, 14, 15, 16, 17];
      businessDays = [0, 1, 2, 3, 4, 5, 6];
      break;
  };

  switch (priority) {
    case "Urgent":
      hours = 4;
      break;
    case "Important":
      hours = 8;
      break;
    case "Medium":
      hours = 16;
      break;
    default:
      hours = 24;
      break;
  };

  let current = new Date(start);

  const advanceToBusinessHour = (currentTime, businessHours, businessDays) => {
    const current = new Date(currentTime);
    let hour = current.getHours();
    let day = current.getDay();
    while (!businessHours.includes(hour) || !businessDays.includes(day)) {
      current.setTime(current.getTime() + 3600000);
      hour = current.getHours();
      day = current.getDay();
    }
    return current;
  };

  current = advanceToBusinessHour(current, businessHours, businessDays);

  for (let i = 1; i <= hours; i++) {
    current.setTime(current.getTime() + 3600000);
    current = advanceToBusinessHour(current, businessHours, businessDays);
  }

  const sameDate = (start, current) => {
    const startDate = {};
    const endDate = {};
    startDate.date = start.getDate();
    startDate.month = start.getMonth();
    startDate.year = start.getFullYear();
    endDate.date = current.getDate();
    endDate.month = current.getMonth();
    endDate.year = current.getFullYear();
    return (startDate.date === endDate.date && startDate.month === endDate.month && startDate.year === endDate.year);
  }

  while (!sameDay && sameDate(start, current)) {
    current.setTime(current.getTime() + 3600000);
    current = advanceToBusinessHour(current, businessHours, businessDays);
  }

  const end = new Date(current);
  return end;
}

// Postpone card
const postponeCardFromNow = (id, token) => {

  window.Trello.cards.get(id, {
    customFields: 'true',
    customFieldItems: 'true'
  }, getCardSuccess, requestFailure)
    .then((card) => {

      // Calculate new dates
      let work = {};
      const now = new Date();
      work.customFields = (card.customFieldItems && card.customFields) ? getCustomFields(card.customFieldItems, card.customFields) : {};
      const newDueDate = addWorkingHours(now, work.customFields.Priority, work.customFields["Action days"]);
      const params = {
        due: JSON.parse(JSON.stringify(newDueDate))
      };
      // Start updates

      // Update main fields
      window.Trello.put(`card/${card.id}`, params, putDueDateSuccess, requestFailure);
    })
}

// Postpone
const postponeFromNow = (t, token) => {

  t.card('id')
    .then((card) => {
      window.Trello.setToken(token);
      postponeCardFromNow(card.id, token);
    })
}