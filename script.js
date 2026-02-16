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
append("     /join 1  to enter to the public chat        ");
append("     '/help' to show all codes          ");
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

  // -----------------------------------------------
  // 🔹 codes  
  // -----------------------------------------------

  if (command === '/create' && args.length >= 3) {
    const code = args[1];
    const groupName = args.slice(2).join(' ');
    if (groupName.length > 30) {
      append("❌ GroupName > 30.", "Blue");
      return;
    }
    try {
      const groupRef = db.collection('groups').doc(groupName);
      const doc = await groupRef.get();
      if (doc.exists) {
        append(`❌   '${groupName}' already exists ;.`, "red");
      } else {
        await groupRef.set({
          created: Date.now(),
          code: code,
          members: []
        });
        await joinGroup(groupName);
        append(` welcome to : ${groupName}`, "#0f0");
      }
    } catch (e) {
      append("❌ Bara 3awid a3ml goupe.", "red");
    }
  }

  else if (command === '/join' && args[1]) {
    const code = args[1];
    const snapshot = await db.collection('groups').where('code', '==', code).get();
    if (!snapshot.empty) {
      const groupName = snapshot.docs[0].id;
      await joinGroup(groupName);
    } else {
      append("❌ al code 8alet.", "red");
    }
  }

  else if (command === '/leave') {
    if (currentGroup) {
      append(`✅ 5raj ml Group: ${currentGroup}`, "#0f0");
      currentGroup = null;
      stopListening();
    } else {
      append("❌ Makch fi group ml Lowil.", "yellow");
    }
  }

  else if (command === '/name' && args[1]) {
    const newName = args.slice(1).join(' ').substring(0, 15);
    userName = newName;
    append(`✅ ismk tawa  ${userName}`, "#0f0");
  }

  else if (command === '/list') {
    if (!currentGroup) {
      append("❌ lzmk tod5ol fi Group 9bal.", "red");
      return;
    }
    // يمكنك لاحقًا تخزين الأعضاء فعليًا
    append(`👥 al 3bad il fi   '${currentGroup}':`);
    append(`  • ${userName} (you)`);
    append("  • Other users will appear here in full version.");
  }

  else if (command === '/whoami') {
    append(`👤 inti: ${userName}`);
    append(`🔗 Group: ${currentGroup || 'None'}`);
  }

  // -----------------------------------------------
  // 🔹 أوامر الرسائل والتنظيم
  // -----------------------------------------------

  else if (command === '/clear') {
    output.innerHTML = '';
    append("✅ Screen cleared.", "#0f0");
  }



  else if (command === '/me' && args[1]) {
    const action = args.slice(1).join(' ');
    if (currentGroup) {
      append(`* ${userName} ${action}`, "#ff8c00");
    } else {
      append("❌ Lzmk tkon fi Group bch tst3ml /me", "red");
    }
  }

  else if (command === '/history') {
    if (!currentGroup) return;
    const messagesRef = db.collection('groups').doc(currentGroup)
                       .collection('messages')
                       .orderBy('timestamp', 'desc').limit(20);
    const snapshot = await messagesRef.get();
    append("📜 a5er 20 msg:", "#0f9");
    snapshot.docs.reverse().forEach(doc => {
      const data = doc.data();
      append(data.text, userColor);
    });
  }

  else if (command === '/pin' && args[1]) {
    append(`📌 Msg ${args[1]} pinned.`, "#00f");
  }

  else if (command === '/unpin' && args[1]) {
    append(`📎msg ${args[1]} unpinned.`, "#00f");
  }

  else if (command === '/edit' && args.length >= 3) {
    const id = args[1];
    const newText = args.slice(2).join(' ');
    append(`✏️ msg ${id} edited to: ${newText}`, "#0f0");
  }

  else if (command === '/delete' && args[1]) {
    append(`🗑️ msg ${args[1]} deleted.`, "red");
  }

  // -----------------------------------------------
  // 🔹 أوامر الإعدادات والتخصيص
  // -----------------------------------------------

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
      append("❌ color mch mawojod . jareb: green, red, blue, yellow, purple, white");
    }
  }

  else if (command === '/theme' && args[1]) {
    const themes = ['classic', 'matrix', 'dark'];
    if (themes.includes(args[1])) {
      theme = args[1];
      document.body.className = theme;
      append(`🎨 Theme changed to: ${theme}`, "#0f0");
    } else {
      append("❌ Them Mch mawojod . jarb : classic, matrix, dark");
    }
  }

  else if (command === '/mute' && args[1]) {
    const user = args[1];
    mutedUsers.add(user);
    append(`🔇 ${user} has been sket.`, "gray");
  }

  else if (command === '/unmute' && args[1]) {
    const user = args[1];
    mutedUsers.delete(user);
    append(`🔊 ${user} Rja3 ya7ki.`, "#0f0");
  }

  else if (command === '/notify' && ['on', 'off'].includes(args[1])) {
    notifications = args[1] === 'on';
    append(`🔔 Notifications t5dm ${notifications ? 'ON' : 'OFF'}.`, "#0f0");
  }

  else if (command === '/status' && args[1]) {
    const status = args.slice(1).join(' ');
    append(`📌 Status walet: ${status}`, "#0f9");
  }

  // -----------------------------------------------
  // 🔹 أوامر المساعدة والأنظمة
  // -----------------------------------------------

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
    append("Shell X chat");
    append("5dmtha B    Firebase & HTML/CSS/JS");
  
  }

  else if (command === '/time') {
    const now = new Date();
    append(`🕒 tawooooo  : ${now.toLocaleString()}`, "#0f0");
  }





  // ❌ أمر غير معروف
  else {
    if (cmd.startsWith('/')) {
      append(`❌ 8aleeet : ${command}. Ikteb '/help' Bch Ta3rf al codet.`, "red");
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
        append("❌ Makech fi Group. Ikteb  /join or /create", "red");
      }
    }
  }
}

// ------------------------------
// 🔗 وظائف المجموعات
// ------------------------------

async function joinGroup(groupName) {
  try {
    const groupRef = db.collection('groups').doc(groupName);
    const doc = await groupRef.get();
    if (!doc.exists) {
      append("❌ famech group .", "red");
      return;
    }
    currentGroup = groupName;
    append(`✅ d5alet ll Group: ${groupName}`, "#0f0");
    startListening(groupName);
  } catch (e) {
    append("❌ Jareb ba3d 3 min.", "red");
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

