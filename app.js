const SUPABASE_URL = 'https://jafefebdfpttwtkmudok.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZI3nHu58SdsYiZr_KncLUg_oK0-eHOJ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const scrollContainer = document.getElementById('mainScroll');
const topbar = document.getElementById('topbar');
const colorUI = document.getElementById('coloring-layer-ui');
const messageUI = document.getElementById('messaging-layer-ui');
const vh = window.innerHeight;

// --- 1. MANUAL SCROLL & VISIBILITY LOGIC ---
scrollContainer.addEventListener('scroll', () => {
    const scrollPos = scrollContainer.scrollTop;
    const totalHeight = scrollContainer.scrollHeight;

    // Handle Topbar Visibility
    if (scrollPos > 20) {
        topbar.classList.add('topbar-hidden');
    } else {
        topbar.classList.remove('topbar-hidden');
    }

    // Determine which layer is active based on scroll position
    if (scrollPos < vh * 0.8) { 
        colorUI.style.display = 'flex'; 
        messageUI.style.display = 'none';
    } else {
        colorUI.style.display = 'none'; 
        messageUI.style.display = 'flex';
    }

    // Loop back to top if user scrolls to the absolute bottom
    if (scrollPos + vh >= totalHeight - 2) {
        scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
});

// --- 2. SUPABASE REALTIME DATA ---
supabaseClient
    .channel('mining-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'remote_messages' }, payload => {
        const { content, password } = payload.new;
        const id = password.toUpperCase();
        
        // Handle Color Detection (A-E)
        const colorSequence = content.toLowerCase().match(/[a-e]/g);
        if (colorSequence) handleColorLogic(colorSequence.join(''), `dot-${id}`);

        // Handle Message Items
        const msgItems = content.match(/(\d*[a-zA-Z])/g);
        if (msgItems) handleMessageLogic(msgItems, `col-${id}`);
    })
    .subscribe();

// --- 3. COLOR DISPLAY LOGIC ---
async function handleColorLogic(pattern, dotId) {
    const dot = document.getElementById(dotId);
    if(!dot) return;
    
    const sequence = pattern.toUpperCase().split('');
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const colorClasses = { 
        'A': 'active-red', 'B': 'active-blue', 'C': 'active-green', 
        'D': 'active-yellow', 'E': 'active-purple' 
    };

    for (let i = 0; i < 5; i++) {
        for (let char of sequence) {
            dot.className = `dot ${colorClasses[char]}`;
            await wait(4000);
            dot.className = 'dot';
            await wait(500); 
        }
        dot.className = 'dot active-white'; await wait(500);
        dot.className = 'dot'; await wait(500);
    }
}

// --- 4. MESSAGE DISPLAY LOGIC (Manual Extension) ---
function handleMessageLogic(items, colId) {
    const column = document.getElementById(colId);
    if(!column) return;

    // Append new messages to the bottom, extending the page height
    items.forEach(item => {
        const box = document.createElement('div');
        box.className = 'msg-box';
        box.innerText = item;
        column.appendChild(box);
    });
    
    // The browser automatically handles the website's scrollbar length 
    // as more 'msg-box' divs are added to the columns.
}
