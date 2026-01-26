const SUPABASE_URL = 'https://jafefebdfpttwtkmudok.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZI3nHu58SdsYiZr_KncLUg_oK0-eHOJ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const scrollContainer = document.getElementById('mainScroll');
const topbar = document.getElementById('topbar');
const colorUI = document.getElementById('coloring-layer-ui');
const messageUI = document.getElementById('messaging-layer-ui');
const vh = window.innerHeight;

// --- 1. VISIBILITY & SCROLL LOGIC ---
scrollContainer.addEventListener('scroll', () => {
    const scrollPos = scrollContainer.scrollTop;

    // Handle Topbar
    if (scrollPos > 20) {
        topbar.classList.add('topbar-hidden');
    } else {
        topbar.classList.remove('topbar-hidden');
    }

    // Hide color dots when scrolling to the message layer
    if (scrollPos < vh * 0.5) {
        colorUI.style.opacity = '1';
        colorUI.style.pointerEvents = 'auto';
    } else {
        colorUI.style.opacity = '0';
        colorUI.style.pointerEvents = 'none';
    }
});

// --- 2. SUPABASE REALTIME SUBSCRIPTION ---
supabaseClient
    .channel('mining-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'remote_messages' }, payload => {
        const { content, password } = payload.new;
        const id = password.toUpperCase(); // 'A' or 'B'
        
        // Extract Colors (a-e)
        const colorSequence = content.toLowerCase().match(/[a-e]/g);
        if (colorSequence) {
            handleColorLogic(colorSequence.join(''), `dot-${id}`);
        }

        // Extract Messages (Digits + Letter)
        const msgItems = content.match(/(\d*[a-zA-Z])/g);
        if (msgItems) {
            handleMessageLogic(msgItems, id);
        }
    })
    .subscribe();

// --- 3. COLOR DISPLAY LOGIC (3s White) ---
async function handleColorLogic(pattern, dotId) {
    const dot = document.getElementById(dotId);
    if(!dot) return;
    
    const sequence = pattern.toUpperCase().split('');
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const colorClasses = { 
        'A': 'active-red', 'B': 'active-blue', 'C': 'active-green', 
        'D': 'active-yellow', 'E': 'active-purple' 
    };

    // Repeat sequence 5 times
    for (let i = 0; i < 5; i++) {
        for (let char of sequence) {
            if (colorClasses[char]) {
                dot.className = `dot ${colorClasses[char]}`;
                await wait(4000);
                dot.className = 'dot';
                await wait(500); 
            }
        }
        // White signal present for 3 seconds
        dot.className = 'dot active-white'; 
        await wait(3000); 
        dot.className = 'dot'; 
        await wait(500);
    }
}

// --- 4. MESSAGE PAGING LOGIC (7-Row Lock) ---
function handleMessageLogic(items, charId) {
    items.forEach(item => {
        let groups = messageUI.querySelectorAll('.msg-group');
        let activeGroup = groups[groups.length - 1];

        // Check if the specific column (A or B) in current group has 7 items
        const currentCount = activeGroup.querySelectorAll(`#col-${charId} .msg-box`).length;

        if (currentCount >= 7) {
            // Create a new "Page" for the next 7 items
            activeGroup = document.createElement('div');
            activeGroup.className = 'msg-group';
            activeGroup.innerHTML = `
                <div id="col-A" class="msg-column"></div>
                <div id="col-B" class="msg-column"></div>
            `;
            messageUI.appendChild(activeGroup);
        }

        // Append to the correct column (A or B)
        const targetCol = activeGroup.querySelector(`#col-${charId}`);
        const box = document.createElement('div');
        box.className = 'msg-box';
        box.innerText = item;
        targetCol.appendChild(box);
    });
}
