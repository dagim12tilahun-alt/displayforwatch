const SUPABASE_URL = 'https://jafefebdfpttwtkmudok.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZI3nHu58SdsYiZr_KncLUg_oK0-eHOJ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const colorUI = document.getElementById('coloring-layer-ui');
const vh = window.innerHeight;

// --- 1. VISIBILITY LOGIC ---
window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;
    colorUI.style.opacity = (scrollPos < vh * 0.3) ? '1' : '0';
});

// --- 2. SUPABASE REALTIME ---
supabaseClient
    .channel('mining-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'remote_messages' }, payload => {
        const { content, password } = payload.new;
        const id = password.toUpperCase();
        
        const colorSequence = content.toLowerCase().match(/[a-e]/g);
        if (colorSequence) handleColorLogic(colorSequence.join(''), `dot-${id}`);

        // Extract numbers and letters, ignoring symbols
        const regex = /(\d*)[^a-zA-Z\d]*([a-zA-Z])/g;
        let match;
        const foundItems = [];
        
        while ((match = regex.exec(content)) !== null) {
            // Convert to Uppercase here
            let cleanMsg = (match[1] + match[2]).toUpperCase();
            foundItems.push(cleanMsg);
        }

        if (foundItems.length > 0) handleMessageLogic(foundItems, `col-${id}`);
    })
    .subscribe();

// --- 3. COLOR LOGIC (3s White End) ---
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
            if (colorClasses[char]) {
                dot.className = `dot ${colorClasses[char]}`;
                await wait(4000);
                dot.className = 'dot';
                await wait(500); 
            }
        }
        dot.className = 'dot active-white'; 
        await wait(3000); 
        dot.className = 'dot'; 
        await wait(500);
    }
}

// --- 4. MESSAGE LOGIC ---
function handleMessageLogic(items, colId) {
    const column = document.getElementById(colId);
    if(!column) return;

    items.forEach(item => {
        const box = document.createElement('div');
        box.className = 'msg-box';
        box.innerText = item;
        column.appendChild(box);
    });
}
