// Gets the users widget settings and present them
function onUserClicked(userName, sender) {
  const header = document.getElementById("Header");
  if (userName === "PUBLIC") {
    header.innerHTML = `willkommen`;
  } else {
    header.innerHTML = `
      ${userName}&nbsp;<i class="fas fa-trash" style="font-size:20px" onclick="onDeleteUserClicked('${userName}')"></i>
    `;
  }

  document.getElementById("RegisterUserForm").style.display = "none";
  document.getElementById("WidgetTableRows").innerHTML = "";
  document.getElementById("WidgetTable").style.display = "block";

  ResetNavbar();
  if (sender !== null) {
    sender.classList.add("active");
  }

  userWidgets = {};

  GetAllWidgets().then((allWidgets) => {
    allWidgets?.forEach((widget) => {
      GetUserWidgetSettings(userName, widget.Name, widget.Version).then(
        (userWidgetSettings) => {
          userWidgets[widget.Name + "_" + widget.Version] = userWidgetSettings;

          document.getElementById("WidgetTableRows").innerHTML += `
            <tr>                
                <td>
                  <button class="btn btn-primary btn-sm btn-light" type="button" data-toggle="collapse" data-target="#collapse${widget.Name}" aria-expanded="false" aria-controls="collapse${widget.Name}"><i class="fas fa-ellipsis-v"></i></button>
                </td>
                <td>${widget.Name}</td>
                <td>${widget.Version}</td>
                <td>${widget.Author}</td>
                <td>${widget.Description}</td>
            </tr>
            <tr>
                <td colspan="5">
                    <div class="collapse" id="collapse${widget.Name}">
                        <div class="form" id="WidgetSettings${widget.Name}Form">
                            ${GetWidgetSettingsForm(widget, userWidgetSettings)}
                            <div style="float:right; margin-bottom:20px;" type="submit" class="btn btn-secondary btn-sm" id="Submit_${widget.Name}" onclick="onSubmitWidgetSettingsClicked(this, '${userName}', '${widget.Name}', ${widget.Version})"><i class="fas fa-check"></i></div>
                        </div>
                    </div>
                </td>
            </tr>`;
        }
      );
    });
  });
}

// Build the ui for each widget setting item
function GetWidgetSettingsForm(widget, widgetSettings) {
  return widgetSettings.WidgetSettingsItems
    .map((widgetSettingsItem) => `
      <div class="form-group row">
          <label class="col-sm-4 col-form-label" for="input_${widget.Name}_${widgetSettingsItem.Key}">
            ${widgetSettingsItem.FriendlyName}
            ${widgetSettingsItem.Description !== null? '<i data-toggle="tooltip" title="' + widgetSettingsItem.Description +'" style="margin-top:3px; margin-left:3px; font-size:13px; vertical-align:top;" class="fas fa-info-circle"></i>': ""}
          </label>
          <div class="col-sm-8">
              ${GetWidgetSettingsFormInput(widget, widgetSettings, widgetSettingsItem)}
          </div>
      </div>`
    )
    .join(' ');
}

// Build the input field -> depends on the WidgetSeettingsItemType
function GetWidgetSettingsFormInput(widget, widgetSettings, widgetSettingsItem) {
  switch (widgetSettingsItem.Type) {
    //Boolean - create a checkmark
    case 2: {
      return `
        <input 
          type="checkbox" 
          id="input_${widget.Name}_${widgetSettingsItem.Key}" 
          onchange="onWidgetSettingValueChanged('${widget.Name}', ${widget.Version}, '${widgetSettingsItem.Key}', this.checked)" 
          value="${GetFormInputValue(widgetSettings, widgetSettingsItem)}" 
          ${widgetSettingsItem.ReadOnly ? "disabled" : ""} 
          ${JSON.parse(GetFormInputValue(widgetSettings, widgetSettingsItem)) ? "checked" : ""
      }>`;
    }
    //Option - create a dropdown
    case 3: {
      let selectedValue = GetFormInputValue(widgetSettings, widgetSettingsItem);
      const options = widgetSettingsItem.Options.split("|")
        .map((option) => 
          "<option" + (selectedValue === option ? " selected" : "") + ">" + option + "</option>\n"
        )
        .join(' ');
      return ` 
        <select 
          class="form-control" 
          onchange="onWidgetSettingValueChanged('${widget.Name}', ${widget.Version}, '${widgetSettingsItem.Key}', this.value)" 
          id="input_${widget.Name}_${widgetSettingsItem.Key}" 
          ${widgetSettingsItem.ReadOnly ? "disabled" : ""}>
            ${options}
        </select>`;
    }
    default: {
      return `
        <input 
          onchange="onWidgetSettingValueChanged('${widget.Name}', ${widget.Version}, '${widgetSettingsItem.Key}', this.value)" 
          type="text" 
          class="form-control" 
          id="input_${widget.Name}_${widgetSettingsItem.Key}" 
          value="${GetFormInputValue(widgetSettings, widgetSettingsItem)}" 
          ${widgetSettingsItem.ReadOnly ? "disabled" : ""}
        >`;
    }
  }
}

// Initialize the input field -> if the setting is configured, enter the value from the database. Otherwise initialize it with the preset value (if there is one).
function GetFormInputValue(widgetSettings, widgetSettingsItem) {
  if (
    widgetSettingsItem.ReadOnly === false &&
    widgetSettings[widgetSettingsItem.Key] !== null &&
    widgetSettings[widgetSettingsItem.Key] !== "null"
  ) {
    return widgetSettings[widgetSettingsItem.Key];
  } else if (
    widgetSettingsItem.PresetValue !== null &&
    widgetSettingsItem.PresetValue !== undefined
  ) {
    return widgetSettingsItem.PresetValue;
  } else {
    return "";
  }
}

//////////////////
// UI manipulation
//////////////////

function ResetNavbar() {
  const navItems = document.getElementsByClassName("userLink");
  Array.from(navItems).forEach((navItem) => {
    navItem.classList.remove("active");
  });
}

function ActivateSubmitButton() {
  document.getElementById("RegisterButton").disabled = false;
}

// Load all users and create links in the navbar
function InitializeNavbar() {
  const navItems = document.getElementsByClassName("userLink");
  Array.from(navItems).forEach((navItem) => {
    navItem.parentElement.removeChild(navItem);
  });

  GetAllUsers().then((users) => {
    let navbarUserList = document.getElementById("NavbarUserList");
    users.forEach((user) => {
      navbarUserList.innerHTML += `
        <li class="nav-item">
            <a class="nav-link userLink" href="#" onclick="onUserClicked('${user.name}', this)">${user.name}</a>
        </li>`;
    });
  });
}

// Load all user profiles
// Build links in the navbar for each user
// Reset the selected user
function LoadIndexPage() {
  InitializeNavbar();
  onUserClicked("PUBLIC", null);
}

/////////////////
// Event handlers
/////////////////

// Settings were updated
// update global var
function onWidgetSettingValueChanged(widgetName, widgetVersion, key, value) {
  userWidgets[widgetName + "_" + widgetVersion][key] = value;
}

// Loads the registration page
function onAddUserClicked() {
  ResetNavbar();
  document.getElementById("WidgetTable").style.display = "none";
  document.getElementById("RegisterUserForm").style.display = "block";
  document.getElementById("Header").innerHTML = "Neuer Benutzer";
}

// User adds or updates a widget to his profile
// Save the updated settings
// The users profile is refreshed, if he currently is in front of the mirror
function onSubmitWidgetSettingsClicked(sender, userName, widgetName, widgetVersion) {
  const {WidgetSettingsItems, ...settings} = userWidgets[`${widgetName}_${widgetVersion}`];
  PutUserWidgetSettings(
    userName,
    widgetName,
    widgetVersion,
    settings
  ).then(() => {
    sender.classList.remove("btn-secondary");
    sender.classList.add("btn-success");
    setTimeout(() => {
      sender.classList.remove("btn-success");
      sender.classList.add("btn-secondary");
    }, 2000);
  });
}

// Registration image selected handler
// Set the hidden img source to allow faceapi to detect descriptors
function onImageSelected(event) {
  document.getElementById("img").src = URL.createObjectURL(
    event.target.files[0]
  );
  window.dispatchEvent(mediaReadyEvent);
}

// User delete clicked
function onDeleteUserClicked(userName) {
  DeleteUser(userName).then(() => LoadIndexPage());
}

// Registeration handler
// Detect face and put user by entered username and detected descriptors
function onRegisterClicked() {
  const userName = document.getElementById("FormName").value;
  if (!userName?.trim()?.length > 0) {
    return;
  }

  DetectSingleFace(fapi, document.getElementById("img")).then((descriptor) =>
    PutUser(userName, descriptor).then(() => LoadIndexPage())
  );
}

////////////
// API Calls
////////////

function GetUserWidgetSettings(userName, widgetName, widgetVersion) {
  return fetch(
    `/api/User/${userName}/WidgetSettings/${widgetName}/${widgetVersion}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response;
    })
    .then((response) => response.json())
    .catch((err) => console.log("Failed to add widget settings", err));
}

function PutUserWidgetSettings(
  userName,
  widgetName,
  widgetVersion,
  widgetSettings
) {
  return fetch(
    `/api/User/${userName}/WidgetSettings/${widgetName}/${widgetVersion}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(widgetSettings),
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response;
    })
    .catch((err) => console.log("Failed to add widget settings", err));
}

function DeleteUser(userName) {
  return fetch(`api/user/${userName}`, { method: "DELETE" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response;
    })
    .catch((err) => console.log("Failed to delete user", err));
}

function GetAllWidgets() {
  return fetch("api/Widget", {
    method: "GET",
    headers: { accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response;
    })
    .then((response) => response.json())
    .catch((err) => console.log("Failed to fetch widgets", err));
}

function GetAllUsers() {
  return fetch("api/user", {
    method: "GET",
    headers: { accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response;
    })
    .then((response) => response.json())
    .catch((err) => console.log("Failed to load all users", err));
}

function PutUser(userName, descriptor) {
  const userData = { Descriptors: [descriptor.toString()] };
  return fetch(`api/user/${userName}`, {
    body: JSON.stringify(userData),
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response;
    })
    .catch((err) => console.log("Failed to register user", err));
}

//////////
// Helpers
//////////

function timeout(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}
