function sortTriggers(triggers) {
  return triggers.sort((a, b) => {
    return a.priority - b.priority;
  });
}

function buildSubscription(triggers, priority) {
  let res = {};
  triggers.forEach(trigger => {
    if (trigger.priority <= priority) {
      trigger.paths.forEach(path => {
        res[path.path] = path;
      });
    }
  });
  return Object.values(res);
}

function run(triggers) {
  let sorted = sortTriggers(triggers.triggers);
  sorted.forEach(trigger => {
    trigger.paths = buildSubscription(sorted, trigger.priority);
  });
  return sorted;
}

var triggers = {
  triggers: [{
      condition: "true",
      paths: [{
        path: "navigation.position",
        context: "*",
        rate: 10
      }, {
        path: "propulsion.revolutions",
        context: "*",
        rate: 10
      }],
      priority: 1

    }, {
      condition: "overrev",
      paths: [{
        path: "propulsion.revolutions",
        context: "*",
        rate: 1
      }],
      priority: 2

    }

  ]
};
// console.log("sort ", sortTriggers(triggers.triggers));

// console.log("prio 1", buildSubscription(triggers.triggers, 1));

// console.log("prio 2", buildSubscription(triggers.triggers, 2));

console.log(JSON.stringify(run(triggers), null, 2));
