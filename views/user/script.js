const token = new URLSearchParams(window.location.search).get('token');
let companies = [];
let ip = null;

document.addEventListener('DOMContentLoaded', async () => {
    showCredentials(); 
    document.getElementById('add-credential-button').addEventListener('click', showCompanies);
    document.getElementById('return-to-credentials-button').addEventListener('click', showCredentials);
    document.getElementById('return-to-companies-button').addEventListener('click', showCompanies);
    document.getElementById('add-credential-form').addEventListener('submit', addCredential);
    document.getElementById('feedback-form').addEventListener('submit', sendFeedback);

    getCollectors()
        .then(c => {
            console.log(c.length, 'companies loaded');
            companies = c;
        }).catch(error => {
            console.error('Error getting the companies:', error);
        });

    getIp()
        .then(i => {
            ip = i;
        }).catch(error => {
            console.error('Error getting the IP address:', error);
        });
});

async function getCollectors() {
    const response = await fetch(`collectors?locale=${locale}`);
    return await response.json();
}

async function getIp() {
    const response = await fetch("https://api.ipify.org?format=json")
    return (await response.json()).ip;
}

function buildCredentialFooter(credential) {
    if (credential.state == "ERROR") {
        return `
            <div class="credential-footer credential-error">
                <img src="/views/icons/error.png" alt="Error"/>
                <div>${credential.error}</div>
            </div>
        `;
    }
    else if (credential.state == "PENDING") {
        return `
            <div class="credential-footer credential-warning">
                <img src="/views/icons/pending.png" alt="Pending"/>
            </div>
        `;
    }
    else {
        return `
            <div class="credential-footer credential-success">
                <img src="/views/icons/success.png" alt="Success"/>
            </div>
        `;
    }
}

async function showCredentials() {
    document.getElementById('credentials-container').hidden = false;
    document.getElementById('companies-container').hidden = true;
    document.getElementById('form-container').hidden = true;
    document.getElementById('feedback-container').hidden = true;

    const response = await fetch(`credentials?token=${token}`);
    const credentials = await response.json();

    const credentialsList = document.getElementById('credentials-list');
    credentialsList.innerHTML = '';

    credentials.forEach(credential => {
        const credentialItem = document.createElement('div');
        credentialItem.className = 'credential-item company-item';
        credentialItem.innerHTML = `
            <img src="${credential.collector.logo}" alt="${credential.collector.name}">
            <div>
            <h3>${credential.collector.name}</h3>
            <p>${credential.note}</p>
            </div>
            <button class="button delete-button" onclick="deleteCredential('${credential.id}')">
                <img src="/views/icons/delete.png" alt="Delete"/>
            </button>
            ${buildCredentialFooter(credential)}
        `;
        credentialsList.appendChild(credentialItem);
    });
}

async function showCompanies() {
    document.getElementById('credentials-container').hidden = true;
    document.getElementById('companies-container').hidden = false;
    document.getElementById('form-container').hidden = true;
    document.getElementById('feedback-container').hidden = true;

    const companyList = document.getElementById('companies-list');
    companyList.innerHTML = '';

    companies.forEach(company => {
        const companyItem = document.createElement('li');
        companyItem.className = 'company-item company-item-selectable';
        companyItem.innerHTML = `
            <img src="${company.logo}" alt="${company.name}">
            <div>
                <h3>${company.name}</h3>
                <p>${company.description}</p>
            </div>
        `;
        companyItem.addEventListener('click', () => showForm(company));
        companyList.appendChild(companyItem);
    });
}

function showForm(company) {
    document.getElementById('credentials-container').hidden = true;
    document.getElementById('companies-container').hidden = true;
    document.getElementById('form-container').hidden = false;
    document.getElementById('feedback-container').hidden = true;
    
    // Update the form with the company's information
    document.getElementById('company-logo').src = company.logo;
    document.getElementById('company-name').textContent = company.name;
    document.getElementById('company-description').textContent = company.description;
    document.querySelector('#add-credential-instructions').hidden = !company.instructions;
    document.querySelector('#add-credential-instructions p').innerHTML = company.instructions;
    document.getElementById('add-credential-form').dataset.collector = company.id;

    // Add input fields
    const form = document.getElementById('add-credential-form-params');
    form.innerHTML = ''; // Clear any existing fields

    Object.keys(company.params).forEach(key => {
        // Get the parameter
        const param = company.params[key];

        // Add label
        const label = document.createElement('label');
        label.textContent = param.name;

        if (param.mandatory) {
            const required = document.createElement('span');
            required.textContent = ' *';
            required.style.color = 'red';
            label.appendChild(required);
        }

        // Add input
        const input = document.createElement('input');
        if (key === 'password' || key === 'token') {
            input.setAttribute('type', 'password');
        } else {
            input.setAttribute('type', 'text');
        }
        input.setAttribute('name', key);
        input.placeholder = param.placeholder;
        input.required = param.mandatory;

        form.appendChild(label);
        form.appendChild(input);
    });
}

async function addCredential(event) {
    event.preventDefault();

    // Convert form data to object
    const formData = new FormData(event.target);
    let params = {};
    formData.forEach((value, key) => {
        params[key] = value;
    });

    await fetch(`credential?token=${token}`, {
        method: 'POST',
        body: JSON.stringify({
            collector: event.target.dataset.collector,
            params
        }),
        headers: {
            'Content-Type': 'application/json',
            'X-User-Ip': ip
        }
    });

    document.getElementById('add-credential-form').reset();
    showCredentials();
}

async function deleteCredential(id) {
    await fetch(`credential/${id}?token=${token}`, {
        method: 'DELETE'
    });

    showCredentials();
}

async function showFeedback() {
    document.getElementById('credentials-container').hidden = true;
    document.getElementById('companies-container').hidden = true;
    document.getElementById('form-container').hidden = true;
    document.getElementById('feedback-container').hidden = false;
    document.getElementById('feedback-response-success').hidden = true;
    document.getElementById('feedback-response-error').hidden = true;
}

async function sendFeedback(event) {
    event.preventDefault();

    // Convert form data to object
    const formData = new FormData(event.target);
    let params = {};
    formData.forEach((value, key) => {
        params[key] = value;
    });

    const response = await fetch(`feedback?token=${token}`, {
        method: 'POST',
        body: JSON.stringify({...params}),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    document.getElementById('feedback-form').reset();

    // Check if the response is ok
    if (!response.ok) {
        document.getElementById('feedback-response-error').hidden = false;
    }
    else {
        document.getElementById('feedback-response-success').hidden = false;
    }
}
