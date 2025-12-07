// test.js (run with: node test.js)

async function fetchSteamInventory(userIdOrCustomUrl, appId = 730, contextId = 2, language = "english", count = 5000) {
    const url = `https://steamcommunity.com/id/${userIdOrCustomUrl}/inventory/json/${appId}/${contextId}/?l=${language}&count=${count}`;
    
    try {
        const res = await fetch(url);
        
        if (!res.ok) {
            console.error("HTTP error:", res.status);
            return null;
        }

        const data = await res.json();

        if (!data?.success) {
            console.error("Inventory is private or invalid.");
            return null;
        }

        return data;
    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}

// Example usage
(async () => {
    const inv = await fetchSteamInventory("157892340");
    console.log(inv);
})();
