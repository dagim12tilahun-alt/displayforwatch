const SUPABASE_URL = 'https://jafefebdfpttwtkmudok.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZI3nHu58SdsYiZr_KncLUg_oK0-eHOJ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const scrollContainer = document.getElementById('mainScroll');
const topbar = document.getElementById('topbar');
const colorUI = document.getElementById('coloring-layer-ui');
const messageUI = document.getElementById('messaging-layer-ui');
const vh = window.innerHeight;

// --- 1. SCROLL VISIBILITY ---
scrollContainer.addEventListener('scroll', () => {
    const scrollPos = scrollContainer.scrollTop;
    if (scrollPos > 20) topbar.classList.add('topbar-hidden');
    else topbar.classList.remove('topbar-hidden');

    if (scrollPos < vh * 0.5) {
        colorUI.style.opacity = '1';
        messageUI.style.display = 'none';
    } else {
        colorUI.style.opacity = '0';
        messageUI.style.display = 'flex';
    }
});

// --- 2. SUPABASE REALTIME ---
supabaseClient
    .channel('mining-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'remote_messages' }, payload => {
        const { content, password } = payload.new;
        const id = password.toUpperCase();
        
        const colorSequence = content.toLowerCase().match(/[a-e]/g);
        if (colorSequence) handleColorLogic(colorSequence.join(''), `dot-${id}`);

        const msgItems = content.match(/(\d*[a-zA-Z])/g);
        if (msgItems) handleMessageLogic(msgItems, id);
    })
    .subscribe();

// --- 3. COLOR LOGIC (3s White Color) ---
async function handleColorLogic(pattern, dotId) {
    const dot = document.getElementById(dotId);
    if(!dot) return;
    
    const sequence = pattern.toUpperCase().split('');
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const colorClasses = { 'A': 'active-red', 'B': 'active-blue', 'C': 'active-green', 'D': 'active-yellow', 'E': 'active-purple' };

    for (let i = 0; i < 5; i++) {
        for (let char of sequence) {
            if (colorClasses[char]) {
                dot.className = `dot ${colorClasses[char]}`;
                await wait(4000);
                dot.className = 'dot';
                await wait(500); 
            }
        }
        // White present for 3 seconds as requested
        dot.className = 'dot active-white'; 
        await wait(3000); 
        dot.className = 'dot'; 
        await wait(500);
    }
}

// --- 4. PAGING MESSAGE LOGIC (Lock every 7) ---
function handleMessageLogic(items, charId) {
    items.forEach(item => {
        // Find all existing groups
        let groups = messageUI.querySelectorAll('.msg-group');
        let activeGroup = groups[groups.length - 1];

        // Check if we need a new group (if the last group's columns have 7 items)
        if (!activeGroup || activeGroup.querySelectorAll(`#col-${charId} .msg-box`).length >= 7) {
            activeGroup = document.createElement('div');
            activeGroup.className = 'msg-group';
            activeGroup.innerHTML = `
                <div id="col-A" class="msg-column"></div>
                <div id="col-B" class="msg-column"></div>
            `;
            messageUI.appendChild(activeGroup);
        }

        // Add the message to the specific column in the active group
        const targetCol = activeGroup.querySelector(`#col-${charId}`);
        const box = document.createElement('div');
        box.className = 'msg-box';
        box.innerText = item;
        targetCol.appendChild(box);
    });
}
