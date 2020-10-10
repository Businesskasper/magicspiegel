// Basic http get
function Get(url) {

    return new Promise((resolve, reject) => {

        fetch(url, {method: "GET", headers: {'Content-Type': 'application/json'}}).then(res => {
    
            if (res.ok) {
                return res.json();
            }
            else {
                reject(res.status);
            }
        }).then((resObject) => {
    
            resolve(resObject);
        });   
    })
}

// Basic http post
function Post(url, obj, getReturn) {

    return new Promise((resolve, reject) => {

        fetch(url, {method: "POST", body: JSON.stringify(obj), headers: {'Content-Type': 'application/json'}}).then(res => {
    
            if (res.ok) {

                if (getReturn) {

                    return res.json();
                }
                else {

                    resolve();
                }               
            }
            else {
                reject(res.status);
            }
        }).then((resObject) => {
    
            resolve(resObject);
        }).catch((err) => {

            reject(err);
        });   
    })
}

async function timeout(duration) {

    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    })
}

function ResetNavbar() {

    let navItems = document.getElementsByClassName('userLink');
    Array.from(navItems).forEach((navItem) => {

        navItem.classList.remove('active');
    })
}

function ActivateSubmitButton() {

    document.getElementById('RegisterButton').disabled = false;
}

// This function is used to register a user with his photo - if a face gets detected, the descriptors and the specified username will be stored in the database.
function Register(detectionSource) {

    let userName = document.getElementById('FormName').value;
    if (userName === undefined || userName.trim() == '') {

        return;
    }

    DetectSingleFace(fapi, document.getElementById(detectionSource)).then((descriptor) => {

        console.log(descriptor);
        Post('api/user/new', {Name: userName, Descriptors: [descriptor.toString()]}, false).then(() => {

            console.log('Registered!');
            //window.location.href = '/';
            LoadIndexPage();

        }).catch(() => {

            console.error('Failed to register!');
        })
    });
}

// Loads the registration page
function AddUserClicked() {

    ResetNavbar();
    document.getElementById('WidgetTable').style.display = 'none';
    document.getElementById('RegisterUserForm').style.display = 'block';
    document.getElementById('Header').innerHTML = 'Neuer Benutzer';
}

// Gets the users widget settings and present them
function UserClicked(user, sender) {

    if (user === "PUBLIC") {

        document.getElementById('Header').innerHTML = `willkommen`;
    }
    else {

        document.getElementById('Header').innerHTML = `${user}&nbsp;<i class="fas fa-trash" style="font-size:20px" onclick="DeleteUser('${user}')"></i>`;
    }
    
    document.getElementById('RegisterUserForm').style.display = 'none';
    document.getElementById('WidgetTableRows').innerHTML = '';
    document.getElementById('WidgetTable').style.display = 'block';

    userWidgets = {};
    selectedUserName = user;

    Post('api/Widget', {UserName: user}, true).then((widgets) => {
        
        ResetNavbar();
        if (sender !== null) {

            sender.classList.add('active');
        }

        widgets.forEach((widget) => {
            
            // if (user === "PUBLIC") {
            //     widget.Settings.Div = "general";
            // }
            userWidgets[widget.Widget.Name + "_" + widget.Widget.Version] = widget;

            document.getElementById('WidgetTableRows').innerHTML += 
                `<tr>                
                <td><button class="btn btn-primary btn-sm btn-light" type="button" data-toggle="collapse" data-target="#collapse${widget.Widget.Name}" aria-expanded="false" aria-controls="collapse${widget.Widget.Name}"><i class="fas fa-ellipsis-v"></i></button></td>
                <!--<td style="text-align: center;"><input class="form-check-input" type="checkbox" ${widget.Settings.Enabled ? 'checked' : ''} id="${widget.Widget.Name}_Enabled"></td>-->
                <td>${widget.Widget.Name}</td>
                <td>${widget.Widget.Version}</td>
                <td>${widget.Widget.Author}</td>
                <td>${widget.Widget.Description}</td>
            </tr>
            <tr>
                <td colspan="5">
                    <div class="collapse" id="collapse${widget.Widget.Name}">
                        <div class="form" id="WidgetSettings${widget.Widget.Name}Form">
                            ${GetWidgetSettingsForm(widget, user)}
                            <div style="float:right; margin-bottom:20px;" type="submit" class="btn btn-secondary btn-sm" id="Submit_${widget.Widget.Name}" onclick="SubmitWidgetSettings(this, '${widget.Widget.Name}', ${widget.Widget.Version})"><i class="fas fa-check"></i></div>
                        </div>
                    </div>
                </td>
            </tr>`;
        })
    });
}

// Build the ui for each widget setting item
function GetWidgetSettingsForm(widget, user) {

    let returnString = ''
    widget.Settings.WidgetSettingsItems.forEach((widgetSettingsItem) => {

        // if (!(user === "PUBLIC" && widgetSettingsItem.Key === "Div")) {

            returnString += `
            <div class="form-group row">
                <label class="col-sm-4 col-form-label" for="input_${widget.Widget.Name}_${widgetSettingsItem.Key}">${widgetSettingsItem.FriendlyName}${widgetSettingsItem.Description !== null ? '<i data-toggle="tooltip" title="' + widgetSettingsItem.Description + '" style="margin-top:3px; margin-left:3px; font-size:13px; vertical-align:top;" class="fas fa-info-circle"></i>' : ''}</label>
                <div class="col-sm-8">
                    ${GetWidgetSettingsFormInput(widget, widgetSettingsItem)}
                </div>
            </div>
            `;
        // }
    })
    return returnString;
}

// Build the input field -> depends on the WidgetSeettingsItemType
function GetWidgetSettingsFormInput(widget, widgetSettingsItem) {
    
    let formInput = '';
    switch(widgetSettingsItem.Type) {
        //Boolean - create a checkmark
        case 2: {
            formInput = `<input type="checkbox" onchange="WidgetSettingValueChanged('${widget.Widget.Name}', ${widget.Widget.Version}, '${widgetSettingsItem.Key}', this.checked)" id="input_${widget.Widget.Name}_${widgetSettingsItem.Key}" value="${GetFormInputValue(widget, widgetSettingsItem)}" ${widgetSettingsItem.ReadOnly ? 'disabled': ''} ${JSON.parse(GetFormInputValue(widget, widgetSettingsItem)) ? 'checked' : ''}>`;
            break;
        }
        //Option - create a dropdown
        case 3: {
            let selectedValue = GetFormInputValue(widget, widgetSettingsItem);
            let options =  ''
            widgetSettingsItem.Options.split('|').forEach((option) => {
                options += '<option' + (selectedValue === option ? ' selected' : '') +'>' + option + '</option>\n'
            })
            formInput = ` 
            <select class="form-control" onchange="WidgetSettingValueChanged('${widget.Widget.Name}', ${widget.Widget.Version}, '${widgetSettingsItem.Key}', this.value)" id="input_${widget.Widget.Name}_${widgetSettingsItem.Key}" ${widgetSettingsItem.ReadOnly ? 'disabled': ''}>
               ${options}
            </select>`
            break;
        }
        default: {
            formInput = `<input onchange="WidgetSettingValueChanged('${widget.Widget.Name}', ${widget.Widget.Version}, '${widgetSettingsItem.Key}', this.value)" type="text" class="form-control" id="input_${widget.Widget.Name}_${widgetSettingsItem.Key}" value="${GetFormInputValue(widget, widgetSettingsItem)}" ${widgetSettingsItem.ReadOnly ? 'disabled': ''}>`;
            break;
        }
    }

    return formInput;
}

// Initialize the input field -> if the setting is configured, enter the value from the database. Otherwise initialize it with the preset value (if there is one).
function GetFormInputValue(widget, widgetSettingsItem) {
    
    if (widgetSettingsItem.ReadOnly === false && widget.Settings[widgetSettingsItem.Key] !== null && widget.Settings[widgetSettingsItem.Key] !== "null") {

        return widget.Settings[widgetSettingsItem.Key];
    }
    else if (widgetSettingsItem.PresetValue !== null && widgetSettingsItem.PresetValue !== undefined) {

        return widgetSettingsItem.PresetValue;
    }
    else {
        
        return '';
    }
}


function WidgetSettingValueChanged(widgetName, widgetVersion, key, value) {

    userWidgets[widgetName + "_" + widgetVersion].Settings[key] = value;
}

// If the user saves his settings the WidgetSettings Object gets saved in the database. Inter process communication will be used to notify the main window about he changed settings and the profile gets reloaded.
function SubmitWidgetSettings(sender, widgetName, widgetVersion) {

    Post('api/WidgetSettings/insert', {UserName: selectedUserName, Widget: userWidgets[widgetName + "_" + widgetVersion]}, false).then(() => {

        sender.classList.remove('btn-secondary');
        sender.classList.add('btn-success');
        setTimeout(() => {

            sender.classList.remove('btn-success');
            sender.classList.add('btn-secondary');
        }, 2000)
    })
}

function LoadNavBar() {

    let navItems = document.getElementsByClassName('userLink');
    Array.from(navItems).forEach((navItem) => {

        navItem.parentElement.removeChild(navItem);
    })

    Get('api/User').then((users) => {

        let navbarUserList = document.getElementById('NavbarUserList');
        users.forEach(user => {
            
            navbarUserList.innerHTML += 
            `<li class="nav-item">
                <a class="nav-link userLink" href="#" onclick="UserClicked('${user.Name}', this)">${user.Name}</a>
            </li>`;
        });
    });
}

function LoadIndexPage() {

    LoadNavBar();
    UserClicked("PUBLIC", null);
}


function SetImgSource(event) {

    document.getElementById('img').src = URL.createObjectURL(event.target.files[0]);
    window.dispatchEvent(mediaReadyEvent);
}

async function InitializeMedia() {

    console.log(`InitializeMedia()`)

    try {

        console.log(`InitializeMedia() -> Using webcam`)

        document.getElementById('FormGroupMedia').innerHTML = '<video id="cam" autoplay muted playsinline style="display: block; visibility: visible; height: 512px; width: 512px;"></video>'
        let mediaDiv = document.getElementById('cam');
        mediaDiv.onplaying = (() => {

            window.dispatchEvent(mediaReadyEvent);
        })
    
        mediaDiv.srcObject = await navigator.mediaDevices.getUserMedia({

            audio: false,
            video: {
                facingMode: "user",
                width: 512,
                height: 512
            }
        })
        document.getElementById('RegisterButton').onclick = () => {
            Register('cam');
        }
    }
    catch {

        console.log(`InitializeMedia() -> Fallback to image upload`)

        document.getElementById('FormGroupMedia').innerHTML = `
        <img id="img" style="display: block; visibility: visible; height: 512px; width: 512px; object-fit: cover;"/>
        <br>
        <input type="file" accept="image/*" onchange="SetImgSource(event)">`;

        document.getElementById('RegisterButton').onclick = () => {
            Register('img');
        }
    }
}

function DeleteUser(user) {

    Post(`api/user/delete`, {Name: user}, false).then(() => {

        LoadIndexPage();
    })
}