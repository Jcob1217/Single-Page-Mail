document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

// Function to set the display property of an element
function setDisplay(elementId, value) {
  document.querySelector(elementId).style.display = value;
}

// Function to show the compose email view
function compose_email() {
  // Show compose view and hide other views
  setDisplay('#emails-view', 'none');
  setDisplay('#emails-mailbox', 'none');
  setDisplay('#compose-view', 'block');
  setDisplay('#view-email', 'none');

  // Clear out composition fields
  document.querySelector('#compose-recipients');
}

// Function to load a specific mailbox
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  setDisplay('#emails-view', 'none')
  setDisplay('#emails-mailbox', 'block')
  setDisplay('#compose-view', 'none')
  setDisplay('#view-email', 'none')

  // Show the mailbox name
  let emails_view = document.querySelector('#emails-view')
  emails_view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  console.log(mailbox.charAt(0).toUpperCase() + mailbox.slice(1))

  document.querySelector('#emails-mailbox').innerHTML = ''

  // Fetch emails from the server
  fetch(`/emails/${mailbox}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(emails => {
      emails.forEach(email => {
        create_email_div(email, mailbox)
      });
    });
}

// Function to send an email
function send_email() {
  setDisplay('#emails-view', 'none');
  setDisplay('#emails-mailbox', 'none');
  setDisplay('#compose-view', 'block');
  setDisplay('#view-email', 'none');

  // Send the email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      sender: document.querySelector('#compose-sender').value,
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(email => {
    console.log(email);
    load_mailbox('sent');
  })
}

// Function to create an email div
function create_email_div(email, mailbox) {
  var element = document.createElement('div');
  element.setAttribute('class', 'd-flex emails-element');

  var container = document.createElement('div');
  container.setAttribute('class', 'align-self-stretch container');

  container.addEventListener('click', () => {
    view_email(email);
  });

  if (email.read && mailbox !== 'sent') {
    element.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
  }

  var sender = document.createElement('div');
  switch (mailbox) {
    case 'sent':
      sender.innerHTML = email.recipients;
      break;
    default:
      sender.innerHTML = email.sender
      break;
  }

  sender.setAttribute('class', 'p-2 emails-sender');

  var subject = document.createElement('div');
  subject.innerHTML = email.subject;
  subject.setAttribute('class', 'p-2');

  var timestamp = document.createElement('div');
  timestamp.innerHTML = email.timestamp;
  timestamp.setAttribute('class', 'p-2 emails-timestamp');

  if (mailbox != 'sent') {
      var dropdown = document.createElement('div');
      dropdown.setAttribute('class', 'ml-auto p-2 dropdown');
      dropdown.innerHTML = '&#8230';

      var dropdownMenu = document.createElement('ul');
      dropdownMenu.setAttribute('class', 'dropdown-menu');

      var archive = document.createElement('li');
      
      if (email.archived) {
        archive.innerHTML = 'Unarchive';
      } else {
        archive.innerHTML = 'Archive'
      }

      dropdownMenu.appendChild(archive);
      
      archive.addEventListener('click', () => {
        archive_email(email);
      })
    
      dropdown.appendChild(dropdownMenu);

      dropdown.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });
  }

  container.appendChild(sender);
  container.appendChild(subject);
  container.appendChild(timestamp);

  element.appendChild(container);

  if (mailbox != 'sent') {
    element.appendChild(dropdown);
  }

  document.querySelector('#emails-mailbox').appendChild(element);
};

// Function to archive/unarchive an email
function archive_email(email) {
  var archived = !email.archived;

  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archived
    })
  })
  .then(response => {
    console.log(email);
    load_mailbox('inbox');
  })
}

// Function to view an email
function view_email(email) {
  fetch(`/emails/${email.id}`)
  .then(response => response.json())
  .then(email => {
    email_page(email);
  });

  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

// Function to display the email details on the page
function email_page(email) {
  setDisplay('#emails-view', 'none')
  setDisplay('#emails-mailbox', 'none')
  setDisplay('#compose-view', 'none')
  setDisplay('#view-email', 'block')

  document.querySelector('#view-email').innerHTML = ''
  
  var element = document.createElement('div');  

  const email_details = [
                          ['From:', email.sender],
                          ['To:', email.recipients],
                          ['Subject:', email.subject],
                          ['Timestamp:', email.timestamp]
                        ]

  for (var email_detail of email_details) {

    var box = document.createElement('div');
    box.setAttribute('class', 'detail-box');

    var label = document.createElement('div');
    label.setAttribute('class', 'detail-label');
    label.innerHTML = email_detail[0]
    
    var info = document.createElement('div');
    info.setAttribute('class', 'detail-info');
    info.innerHTML = email_detail[1];
    
    box.appendChild(label)
    box.appendChild(info)
    
    element.appendChild(box);
  }

  var reply_button = document.createElement('button');
  reply_button.innerHTML = 'Reply';
  reply_button.setAttribute('class', 'btn btn-sm btn-outline-primary reply-button')
  
  reply_button.addEventListener('click', () => {
    reply(email);
  })

  var email_body = document.createElement('div');
  email_body.innerHTML = email.body;

  document.querySelector('#view-email').appendChild(element);
  document.querySelector('#view-email').appendChild(reply_button);
  document.querySelector('#view-email').appendChild(document.createElement('hr'));
  document.querySelector('#view-email').appendChild(email_body);
}

// Function to compose a reply to an email
function reply(email) {
  console.log(email);

  compose_email();

  var subject = email.subject;

  // Set the recipient as the original sender of the email
  document.querySelector('#compose-recipients').value = email.sender;

  // Check if the subject already has "Re:" prefix, if not, add it
  if (subject.split(' ', 1)[0] != 'Re:') {
    subject = 'Re: ' + email.subject;
  }

  // Set the subject and body of the composed email, including the original email content
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \n${email.body}\n`;
}
