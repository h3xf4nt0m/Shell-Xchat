const firebaseConfig = {
  apiKey: "***",
  authDomain: "***",
  projectId: "shell-x",
  storageBucket: "*****",
  messagingSenderId: "*",
  appId: "***"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentGroup = null;
let userName = `user_${Math.floor(1000 + Math.random() * 9000)}`; 
let userColor = '#0f0'; 
let theme = 'classic';
let mutedUsers = new Set();
let notifications = true;

const output = document.getElementById('output');
const input = document.getElementById('input');

function append(text, color = userColor) {
  const line = document.createElement('div');
  line.textContent = text;
  line.style.color = color;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

append("=======================================================");
append("     Shell X Chat   ");
append("     /join <code>  to enter a chat room        ");
append("     '/help' to show all commands          ");
append("=======================================================");
append("");

input.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const cmd = input.value.trim();
    if (!cmd) return;

    append(`$ ${cmd}`, '#ccc');
    input.value = '';
    await handleCommand(cmd);
  }
});

async function handleCommand(cmd) {
  const args = cmd.trim().split(' ');
  const command = args[0].toLowerCase();

  if (command === '/create' && args.length >= 3) {
    const code = args[1];
    const groupName = args.slice(2).join(' ');
    if (groupName.length > 30) {
      append("❌ Group Name must be less than 30 characters.", "Blue");
      return;
    }
    try {
      const groupRef = db.collection('groups').doc(groupName);
      const doc = await groupRef.get();
      if (doc.exists) {
        append(`❌ Group '${groupName}' already exists.`, "red");
      } else {
        await groupRef.set({
          created: Date.now(),
          code: code,
          members: []
        });
        await joinGroup(groupName);
        append(`Welcome to: ${groupName}`, "#0f0");
      }
    } catch (e) {
      append("❌ Failed to create group. Please try again.", "red");
    }
  }

  else if (command === '/join' && args[1]) {
    const code = args[1];
    const snapshot = await db.collection('groups').where('code', '==', code).get();
    if (!snapshot.empty) {
      const groupName = snapshot.docs[0].id;
      await joinGroup(groupName);
    } else {
      append("❌ Invalid code.", "red");
    }
  }

  else if (command === '/leave') {
    if (currentGroup) {
      append(`✅ Left Group: ${currentGroup}`, "#0f0");
      currentGroup = null;
      stopListening();
    } else {
      append("❌ You are not in a group.", "yellow");
    }
  }

  else if (command === '/name' && args[1]) {
    const newName = args.slice(1).join(' ').substring(0, 15);
    userName = newName;
    append(`✅ Your name is now ${userName}`, "#0f0");
  }

  else if (command === '/list') {
    if (!currentGroup) {
      append("❌ You must join a group first.", "red");
      return;
    }
    append(`👥 Members in '${currentGroup}':`);
    append(`  • ${userName} (you)`);
    append("  • Other users will appear here in the full version.");
  }

  else if (command === '/whoami') {
    append(`👤 User: ${userName}`);
    append(`🔗 Group: ${currentGroup || 'None'}`);
  }

  else if (command === '/clear') {
    output.innerHTML = '';
    append("✅ Screen cleared.", "#0f0");
  }

  else if (command === '/me' && args[1]) {
    const action = args.slice(1).join(' ');
    if (currentGroup) {
      append(`* ${userName} ${action}`, "#ff8c00");
    } else {
      append("❌ Join a group to use /me.", "red");
    }
  }

  else if (command === '/history') {
    if (!currentGroup) return;
    const messagesRef = db.collection('groups').doc(currentGroup)
                       .collection('messages')
                       .orderBy('timestamp', 'desc').limit(20);
    const snapshot = await messagesRef.get();
    append("📜 Last 20 messages:", "#0f9");
    snapshot.docs.reverse().forEach(doc => {
      const data = doc.data();
      append(data.text, userColor);
    });
  }

  else if (command === '/pin' && args[1]) {
    append(`📌 Msg ${args[1]} pinned.`, "#00f");
  }

  else if (command === '/unpin' && args[1]) {
    append(`📎 Message ${args[1]} unpinned.`, "#00f");
  }

  else if (command === '/edit' && args.length >= 3) {
    const id = args[1];
    const newText = args.slice(2).join(' ');
    append(`✏️ Message ${id} edited to: ${newText}`, "#0f0");
  }

  else if (command === '/delete' && args[1]) {
    append(`🗑️ Message ${args[1]} deleted.`, "red");
  }

  else if (command === '/color' && args[1]) {
    const colors = {
      green: '#0f0',
      red: '#f00',
      blue: '#00f',
      yellow: '#ff0',
      purple: '#f0f',
      white: '#fff'
    };
    if (colors[args[1].toLowerCase()]) {
      userColor = colors[args[1].toLowerCase()];
      append(`🎨 Text color changed to ${args[1]}.`, userColor);
    } else {
      append("❌ Color not found. Try: green, red, blue, yellow, purple, white");
    }
  }

  else if (command === '/theme' && args[1]) {
    const themes = ['classic', 'matrix', 'dark'];
    if (themes.includes(args[1])) {
      theme = args[1];
      document.body.className = theme;
      append(`🎨 Theme changed to: ${theme}`, "#0f0");
    } else {
      append("❌ Theme not found. Try: classic, matrix, dark");
    }
  }

  else if (command === '/mute' && args[1]) {
    const user = args[1];
    mutedUsers.add(user);
    append(`🔇 ${user} has been muted.`, "gray");
  }

  else if (command === '/unmute' && args[1]) {
    const user = args[1];
    mutedUsers.delete(user);
    append(`🔊 ${user} unmuted.`, "#0f0");
  }

  else if (command === '/notify' && ['on', 'off'].includes(args[1])) {
    notifications = args[1] === 'on';
    append(`🔔 Notifications: ${notifications ? 'ON' : 'OFF'}.`, "#0f0");
  }

  else if (command === '/status' && args[1]) {
    const status = args.slice(1).join(' ');
    append(`📌 Status updated: ${status}`, "#0f9");
  }

  else if (command === '/help') {
    append(`
📘 AVAILABLE COMMANDS:

🔹 Groups & Users:
  /create <code> <name>   - Create a new group
  /join <code>            - Join a group
  /leave                 - Leave current group
  /name <newName>        - Change your name
  /whoami                - Show your name and group

🔹 Messages & Tools:
  /clear                 - Clear screen
  /dm <user> <msg>       - Send private message
  /me <action>           - Perform an action
  /history               - Show last 20 messages
  /pin <id>              - Pin a message
  /edit <id> <text>      - Edit your message
  /delete <id>           - Delete your message

🔹 Settings:
  /color <color>         - Change text color
  /theme <name>          - Change UI theme
  /mute <user>           - Mute a user
  /unmute <user>         - Unmute a user
  /notify <on|off>       - Toggle notifications
  /status <text>         - Set your status

🔹 System:
  /help                  - Show this help
  /about                 - About this app
  /time                  - Show current time
    `, "#0f0");
  }

  else if (command === '/about') {
    append("Shell X Chat");
    append("Built with Firebase & HTML/CSS/JS");
  }

  else if (command === '/time') {
    const now = new Date();
    append(`🕒 Current time: ${now.toLocaleString()}`, "#0f0");
  }

  else {
    if (cmd.startsWith('/')) {
      append(`❌ Unknown command: ${command}. Type '/help' for assistance.`, "red");
    } else {
      if (currentGroup) {
        const messagesRef = db.collection('groups').doc(currentGroup)
                           .collection('messages');
        await messagesRef.add({
          text: `[${userName}] ${cmd}`,
          timestamp: Date.now(),
          user: userName,
          type: 'chat'
        });
      } else {
        append("❌ You are not in a group. Use /join or /create", "red");
      }
    }
  }
}

async function joinGroup(groupName) {
  try {
    const groupRef = db.collection('groups').doc(groupName);
    const doc = await groupRef.get();
    if (!doc.exists) {
      append("❌ Group does not exist.", "red");
      return;
    }
    currentGroup = groupName;
    append(`✅ Joined Group: ${groupName}`, "#0f0");
    startListening(groupName);
  } catch (e) {
    append("❌ Error joining. Please try again in 3 minutes.", "red");
  }
}

let unsubscribe = null;

function startListening(groupName) {
  if (unsubscribe) unsubscribe();

  const messagesRef = db.collection('groups').doc(groupName)
                     .collection('messages')
                     .orderBy('timestamp', 'desc').limit(50);

  unsubscribe = messagesRef.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        if (data.user && mutedUsers.has(data.user)) return;
        append(data.text, userColor);
      }
    });
  });
}

function stopListening() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
