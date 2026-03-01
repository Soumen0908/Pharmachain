// ── Hardcoded Medicine Database (frontend-only, no API) ──

const MEDICINE_DB = {
    'paracetamol': {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        category: 'Analgesic / Antipyretic',
        image: '💊',
        description: 'A widely used over-the-counter pain reliever and fever reducer. Works by inhibiting prostaglandin synthesis in the central nervous system.',
        components: [
            { name: 'Acetaminophen', role: 'Active ingredient', amount: '500mg' },
            { name: 'Povidone', role: 'Binder', amount: '25mg' },
            { name: 'Starch', role: 'Disintegrant', amount: '30mg' },
            { name: 'Stearic Acid', role: 'Lubricant', amount: '5mg' },
            { name: 'Microcrystalline Cellulose', role: 'Filler', amount: '40mg' },
        ],
        substitutes: [
            { name: 'Crocin', manufacturer: 'GSK', strength: '500mg' },
            { name: 'Dolo 650', manufacturer: 'Micro Labs', strength: '650mg' },
            { name: 'Calpol', manufacturer: 'GSK', strength: '500mg' },
            { name: 'Pacimol', manufacturer: 'Ipca Labs', strength: '500mg' },
        ],
    },
    'amoxicillin': {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin Trihydrate',
        category: 'Antibiotic (Penicillin)',
        image: '💉',
        description: 'A broad-spectrum penicillin antibiotic used to treat bacterial infections including respiratory tract, urinary tract, and skin infections.',
        components: [
            { name: 'Amoxicillin Trihydrate', role: 'Active ingredient', amount: '500mg' },
            { name: 'Magnesium Stearate', role: 'Lubricant', amount: '10mg' },
            { name: 'Sodium Starch Glycolate', role: 'Disintegrant', amount: '15mg' },
            { name: 'Gelatin Capsule Shell', role: 'Capsule coating', amount: '—' },
            { name: 'Titanium Dioxide', role: 'Colorant', amount: '2mg' },
        ],
        substitutes: [
            { name: 'Mox 500', manufacturer: 'Ranbaxy', strength: '500mg' },
            { name: 'Amoxil', manufacturer: 'GSK', strength: '500mg' },
            { name: 'Novamox', manufacturer: 'Cipla', strength: '500mg' },
            { name: 'Wymox', manufacturer: 'Pfizer', strength: '250mg' },
        ],
    },
    'metformin': {
        name: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        category: 'Antidiabetic (Biguanide)',
        image: '🩺',
        description: 'First-line medication for type 2 diabetes that decreases hepatic glucose production, decreases intestinal absorption of glucose, and increases insulin sensitivity.',
        components: [
            { name: 'Metformin HCl', role: 'Active ingredient', amount: '500mg' },
            { name: 'Povidone K30', role: 'Binder', amount: '35mg' },
            { name: 'Magnesium Stearate', role: 'Lubricant', amount: '8mg' },
            { name: 'Hypromellose', role: 'Film coating', amount: '20mg' },
            { name: 'Polyethylene Glycol', role: 'Plasticizer', amount: '5mg' },
        ],
        substitutes: [
            { name: 'Glycomet', manufacturer: 'USV', strength: '500mg' },
            { name: 'Glucophage', manufacturer: 'Merck', strength: '500mg' },
            { name: 'Obimet', manufacturer: 'Abbott', strength: '500mg' },
            { name: 'Formin', manufacturer: 'Intas', strength: '500mg' },
        ],
    },
    'aspirin': {
        name: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        category: 'NSAID / Antiplatelet',
        image: '💊',
        description: 'Used for pain relief, anti-inflammation, fever reduction, and blood thinning. Inhibits cyclooxygenase enzymes (COX-1 and COX-2).',
        components: [
            { name: 'Acetylsalicylic Acid', role: 'Active ingredient', amount: '325mg' },
            { name: 'Corn Starch', role: 'Binder/Filler', amount: '50mg' },
            { name: 'Cellulose', role: 'Disintegrant', amount: '20mg' },
            { name: 'Hypromellose', role: 'Coating agent', amount: '10mg' },
            { name: 'Triacetin', role: 'Plasticizer', amount: '3mg' },
        ],
        substitutes: [
            { name: 'Ecosprin', manufacturer: 'USV', strength: '75mg' },
            { name: 'Disprin', manufacturer: 'Reckitt', strength: '350mg' },
            { name: 'Micropirin', manufacturer: 'USV', strength: '75mg' },
            { name: 'Aspicot', manufacturer: 'Glenmark', strength: '150mg' },
        ],
    },
    'ibuprofen': {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        category: 'NSAID',
        image: '💊',
        description: 'Non-steroidal anti-inflammatory drug used for pain, fever, and inflammation. Works by blocking COX enzymes to reduce prostaglandin synthesis.',
        components: [
            { name: 'Ibuprofen', role: 'Active ingredient', amount: '400mg' },
            { name: 'Croscarmellose Sodium', role: 'Disintegrant', amount: '25mg' },
            { name: 'Colloidal Silicon Dioxide', role: 'Glidant', amount: '5mg' },
            { name: 'Hypromellose', role: 'Film coating', amount: '12mg' },
            { name: 'Stearic Acid', role: 'Lubricant', amount: '6mg' },
        ],
        substitutes: [
            { name: 'Brufen', manufacturer: 'Abbott', strength: '400mg' },
            { name: 'Ibugesic', manufacturer: 'Cipla', strength: '400mg' },
            { name: 'Combiflam', manufacturer: 'Sanofi', strength: '400mg+325mg' },
            { name: 'Advil (Imported)', manufacturer: 'Pfizer', strength: '200mg' },
        ],
    },
    'azithromycin': {
        name: 'Azithromycin',
        genericName: 'Azithromycin Dihydrate',
        category: 'Antibiotic (Macrolide)',
        image: '💉',
        description: 'A macrolide antibiotic effective against a wide range of bacteria. Commonly used for respiratory, skin, and sexually transmitted infections.',
        components: [
            { name: 'Azithromycin Dihydrate', role: 'Active ingredient', amount: '500mg' },
            { name: 'Dibasic Calcium Phosphate', role: 'Filler', amount: '100mg' },
            { name: 'Croscarmellose Sodium', role: 'Disintegrant', amount: '20mg' },
            { name: 'Sodium Lauryl Sulfate', role: 'Wetting agent', amount: '5mg' },
            { name: 'Magnesium Stearate', role: 'Lubricant', amount: '8mg' },
        ],
        substitutes: [
            { name: 'Azee', manufacturer: 'Cipla', strength: '500mg' },
            { name: 'Zithromax', manufacturer: 'Pfizer', strength: '250mg' },
            { name: 'Azicip', manufacturer: 'Cipla', strength: '500mg' },
            { name: 'Azilide', manufacturer: 'Aristo', strength: '500mg' },
        ],
    },
    'cetirizine': {
        name: 'Cetirizine',
        genericName: 'Cetirizine Hydrochloride',
        category: 'Antihistamine',
        image: '🤧',
        description: 'A second-generation antihistamine used for allergies, hay fever, and urticaria. Non-drowsy compared to first-generation antihistamines.',
        components: [
            { name: 'Cetirizine HCl', role: 'Active ingredient', amount: '10mg' },
            { name: 'Lactose Monohydrate', role: 'Filler', amount: '65mg' },
            { name: 'Microcrystalline Cellulose', role: 'Binder', amount: '30mg' },
            { name: 'Colloidal Silicon Dioxide', role: 'Glidant', amount: '3mg' },
            { name: 'Magnesium Stearate', role: 'Lubricant', amount: '2mg' },
        ],
        substitutes: [
            { name: 'Zyrtec', manufacturer: 'UCB', strength: '10mg' },
            { name: 'Alerid', manufacturer: 'Cipla', strength: '10mg' },
            { name: 'Cetzine', manufacturer: 'Alkem', strength: '10mg' },
            { name: 'Okacet', manufacturer: 'Cipla', strength: '10mg' },
        ],
    },
    'omeprazole': {
        name: 'Omeprazole',
        genericName: 'Omeprazole Magnesium',
        category: 'Proton Pump Inhibitor',
        image: '🩹',
        description: 'Reduces stomach acid production by blocking the hydrogen-potassium ATPase enzyme. Used for GERD, peptic ulcers, and Zollinger-Ellison syndrome.',
        components: [
            { name: 'Omeprazole Magnesium', role: 'Active ingredient', amount: '20mg' },
            { name: 'Mannitol', role: 'Filler', amount: '50mg' },
            { name: 'Hydroxypropyl Cellulose', role: 'Binder', amount: '15mg' },
            { name: 'Hypromellose Phthalate', role: 'Enteric coating', amount: '25mg' },
            { name: 'Talc', role: 'Anti-adherent', amount: '5mg' },
        ],
        substitutes: [
            { name: 'Prilosec', manufacturer: 'AstraZeneca', strength: '20mg' },
            { name: 'Omez', manufacturer: "Dr. Reddy's", strength: '20mg' },
            { name: 'Ocid', manufacturer: 'Zydus', strength: '20mg' },
            { name: 'Pan 40 (Pantoprazole)', manufacturer: 'Alkem', strength: '40mg' },
        ],
    },
    'ciprofloxacin': {
        name: 'Ciprofloxacin',
        genericName: 'Ciprofloxacin Hydrochloride',
        category: 'Antibiotic (Fluoroquinolone)',
        image: '💉',
        description: 'A broad-spectrum fluoroquinolone antibiotic used for UTIs, respiratory infections, and gastrointestinal infections. Works by inhibiting DNA gyrase.',
        components: [
            { name: 'Ciprofloxacin HCl', role: 'Active ingredient', amount: '500mg' },
            { name: 'Microcrystalline Cellulose', role: 'Filler', amount: '80mg' },
            { name: 'Crospovidone', role: 'Disintegrant', amount: '30mg' },
            { name: 'Magnesium Stearate', role: 'Lubricant', amount: '8mg' },
            { name: 'Hypromellose', role: 'Film coating', amount: '15mg' },
        ],
        substitutes: [
            { name: 'Ciplox', manufacturer: 'Cipla', strength: '500mg' },
            { name: 'Cifran', manufacturer: 'Sun Pharma', strength: '500mg' },
            { name: 'Ciprobid', manufacturer: 'Zydus', strength: '500mg' },
            { name: 'Quintor', manufacturer: 'Torrent', strength: '500mg' },
        ],
    },
    'losartan': {
        name: 'Losartan',
        genericName: 'Losartan Potassium',
        category: 'ARB (Antihypertensive)',
        image: '❤️',
        description: 'An angiotensin II receptor blocker used to treat high blood pressure and protect kidneys in diabetic patients. Relaxes blood vessels.',
        components: [
            { name: 'Losartan Potassium', role: 'Active ingredient', amount: '50mg' },
            { name: 'Microcrystalline Cellulose', role: 'Filler', amount: '60mg' },
            { name: 'Lactose Monohydrate', role: 'Filler', amount: '25mg' },
            { name: 'Pregelatinized Starch', role: 'Binder', amount: '15mg' },
            { name: 'Magnesium Stearate', role: 'Lubricant', amount: '4mg' },
        ],
        substitutes: [
            { name: 'Cozaar', manufacturer: 'MSD', strength: '50mg' },
            { name: 'Losacar', manufacturer: 'Cadila', strength: '50mg' },
            { name: 'Losar', manufacturer: 'Unichem', strength: '50mg' },
            { name: 'Repace', manufacturer: 'Sun Pharma', strength: '50mg' },
        ],
    },
};

const POPULAR_MEDICINES = [
    'Paracetamol', 'Amoxicillin', 'Metformin', 'Aspirin',
    'Ibuprofen', 'Azithromycin', 'Cetirizine', 'Omeprazole',
    'Ciprofloxacin', 'Losartan',
];

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

export function lookupMedicine(query) {
    const key = query.toLowerCase().trim();

    // exact match
    if (MEDICINE_DB[key]) return MEDICINE_DB[key];

    // partial match
    const found = Object.keys(MEDICINE_DB).find(k => k.includes(key) || key.includes(k));
    if (found) return MEDICINE_DB[found];

    // fuzzy match (within 3 edits)
    let bestMatch = null;
    let bestDist = Infinity;
    for (const k of Object.keys(MEDICINE_DB)) {
        const dist = levenshtein(key, k);
        if (dist < bestDist && dist <= 3) {
            bestDist = dist;
            bestMatch = k;
        }
    }
    return bestMatch ? MEDICINE_DB[bestMatch] : null;
}

export function searchMedicines(query) {
    if (!query.trim()) return POPULAR_MEDICINES;
    const q = query.toLowerCase().trim();

    // First: exact substring matches
    const exact = POPULAR_MEDICINES.filter(m => m.toLowerCase().includes(q));

    // Then: fuzzy matches (not already in exact)
    const fuzzy = POPULAR_MEDICINES.filter(m => {
        if (exact.includes(m)) return false;
        return levenshtein(q, m.toLowerCase()) <= 3;
    });

    return [...exact, ...fuzzy];
}

export { POPULAR_MEDICINES, MEDICINE_DB };
