const express = require('express');
const router = express.Router();

// ── Large local medicine DB (Indian market focused) ──
const MEDICINE_DB = {
    'paracetamol': { name: 'Paracetamol', generic: 'Acetaminophen', cat: 'Analgesic/Antipyretic', desc: 'Pain reliever and fever reducer. Inhibits prostaglandin synthesis in CNS.', comp: [{ n: 'Acetaminophen', r: 'Active', a: '500mg' }, { n: 'Povidone', r: 'Binder', a: '25mg' }, { n: 'Starch', r: 'Disintegrant', a: '30mg' }, { n: 'Stearic Acid', r: 'Lubricant', a: '5mg' }], subs: ['Crocin (GSK)', 'Dolo 650 (Micro Labs)', 'Calpol (GSK)', 'Pacimol (Ipca)'] },
    'amoxicillin': { name: 'Amoxicillin', generic: 'Amoxicillin Trihydrate', cat: 'Antibiotic (Penicillin)', desc: 'Broad-spectrum penicillin for bacterial infections of respiratory, urinary tract, skin.', comp: [{ n: 'Amoxicillin Trihydrate', r: 'Active', a: '500mg' }, { n: 'Magnesium Stearate', r: 'Lubricant', a: '10mg' }, { n: 'Sodium Starch Glycolate', r: 'Disintegrant', a: '15mg' }], subs: ['Mox 500 (Ranbaxy)', 'Amoxil (GSK)', 'Novamox (Cipla)', 'Wymox (Pfizer)'] },
    'metformin': { name: 'Metformin', generic: 'Metformin Hydrochloride', cat: 'Antidiabetic (Biguanide)', desc: 'First-line for type 2 diabetes. Decreases hepatic glucose production, increases insulin sensitivity.', comp: [{ n: 'Metformin HCl', r: 'Active', a: '500mg' }, { n: 'Povidone K30', r: 'Binder', a: '35mg' }, { n: 'Magnesium Stearate', r: 'Lubricant', a: '8mg' }, { n: 'Hypromellose', r: 'Film coating', a: '20mg' }], subs: ['Glycomet (USV)', 'Glucophage (Merck)', 'Obimet (Abbott)', 'Formin (Intas)'] },
    'aspirin': { name: 'Aspirin', generic: 'Acetylsalicylic Acid', cat: 'NSAID/Antiplatelet', desc: 'Pain relief, anti-inflammation, fever reduction and blood thinning. Inhibits COX enzymes.', comp: [{ n: 'Acetylsalicylic Acid', r: 'Active', a: '325mg' }, { n: 'Corn Starch', r: 'Binder', a: '50mg' }, { n: 'Cellulose', r: 'Disintegrant', a: '20mg' }], subs: ['Ecosprin (USV)', 'Disprin (Reckitt)', 'Micropirin (USV)', 'Aspicot (Glenmark)'] },
    'ibuprofen': { name: 'Ibuprofen', generic: 'Ibuprofen', cat: 'NSAID', desc: 'For pain, fever and inflammation. Blocks COX enzymes to reduce prostaglandin synthesis.', comp: [{ n: 'Ibuprofen', r: 'Active', a: '400mg' }, { n: 'Croscarmellose Sodium', r: 'Disintegrant', a: '25mg' }, { n: 'Hypromellose', r: 'Film coating', a: '12mg' }], subs: ['Brufen (Abbott)', 'Ibugesic (Cipla)', 'Combiflam (Sanofi)', 'Advil (Pfizer)'] },
    'azithromycin': { name: 'Azithromycin', generic: 'Azithromycin Dihydrate', cat: 'Antibiotic (Macrolide)', desc: 'Macrolide antibiotic for respiratory, skin and STIs.', comp: [{ n: 'Azithromycin Dihydrate', r: 'Active', a: '500mg' }, { n: 'Dibasic Calcium Phosphate', r: 'Filler', a: '100mg' }, { n: 'Croscarmellose Sodium', r: 'Disintegrant', a: '20mg' }], subs: ['Azee (Cipla)', 'Zithromax (Pfizer)', 'Azicip (Cipla)', 'Azilide (Aristo)'] },
    'cetirizine': { name: 'Cetirizine', generic: 'Cetirizine Hydrochloride', cat: 'Antihistamine', desc: 'Second-gen antihistamine for allergies and urticaria. Less sedating than first-gen.', comp: [{ n: 'Cetirizine HCl', r: 'Active', a: '10mg' }, { n: 'Lactose Monohydrate', r: 'Filler', a: '65mg' }, { n: 'MCC', r: 'Binder', a: '30mg' }], subs: ['Zyrtec (UCB)', 'Alerid (Cipla)', 'Cetzine (Alkem)', 'Okacet (Cipla)'] },
    'omeprazole': { name: 'Omeprazole', generic: 'Omeprazole Magnesium', cat: 'Proton Pump Inhibitor', desc: 'Reduces stomach acid. Used for GERD, peptic ulcers.', comp: [{ n: 'Omeprazole Magnesium', r: 'Active', a: '20mg' }, { n: 'Mannitol', r: 'Filler', a: '50mg' }, { n: 'Hypromellose Phthalate', r: 'Enteric coating', a: '25mg' }], subs: ['Omez (Dr Reddys)', 'Prilosec (AstraZeneca)', 'Ocid (Zydus)'] },
    'ciprofloxacin': { name: 'Ciprofloxacin', generic: 'Ciprofloxacin HCl', cat: 'Antibiotic (Fluoroquinolone)', desc: 'Broad-spectrum for UTIs, respiratory and GI infections. Inhibits DNA gyrase.', comp: [{ n: 'Ciprofloxacin HCl', r: 'Active', a: '500mg' }, { n: 'MCC', r: 'Filler', a: '80mg' }, { n: 'Crospovidone', r: 'Disintegrant', a: '30mg' }], subs: ['Ciplox (Cipla)', 'Cifran (Sun)', 'Ciprobid (Zydus)'] },
    'losartan': { name: 'Losartan', generic: 'Losartan Potassium', cat: 'ARB (Antihypertensive)', desc: 'Angiotensin II receptor blocker for hypertension.', comp: [{ n: 'Losartan Potassium', r: 'Active', a: '50mg' }, { n: 'MCC', r: 'Filler', a: '60mg' }, { n: 'Lactose Monohydrate', r: 'Filler', a: '25mg' }], subs: ['Cozaar (MSD)', 'Losacar (Cadila)', 'Repace (Sun)'] },
    'amlodipine': { name: 'Amlodipine', generic: 'Amlodipine Besylate', cat: 'Calcium Channel Blocker', desc: 'For hypertension and angina. Relaxes blood vessels.', comp: [{ n: 'Amlodipine Besylate', r: 'Active', a: '5mg' }, { n: 'MCC', r: 'Filler', a: '50mg' }, { n: 'Sodium Starch Glycolate', r: 'Disintegrant', a: '10mg' }], subs: ['Norvasc (Pfizer)', 'Amlip (Cipla)', 'Stamlo (Dr Reddys)'] },
    'atorvastatin': { name: 'Atorvastatin', generic: 'Atorvastatin Calcium', cat: 'Statin (Cholesterol)', desc: 'Lowers LDL cholesterol and triglycerides. Inhibits HMG-CoA reductase.', comp: [{ n: 'Atorvastatin Calcium', r: 'Active', a: '10mg' }, { n: 'Calcium Carbonate', r: 'Filler', a: '50mg' }, { n: 'MCC', r: 'Binder', a: '30mg' }], subs: ['Lipitor (Pfizer)', 'Atorva (Zydus)', 'Tonact (Lupin)'] },
    'pantoprazole': { name: 'Pantoprazole', generic: 'Pantoprazole Sodium', cat: 'Proton Pump Inhibitor', desc: 'Reduces gastric acid secretion. For GERD and ulcers.', comp: [{ n: 'Pantoprazole Sodium', r: 'Active', a: '40mg' }, { n: 'Mannitol', r: 'Filler', a: '40mg' }, { n: 'Sodium Carbonate', r: 'Alkalizer', a: '10mg' }], subs: ['Pan 40 (Alkem)', 'Pantocid (Sun)', 'Pantop (Aristo)'] },
    'montelukast': { name: 'Montelukast', generic: 'Montelukast Sodium', cat: 'Leukotriene Antagonist', desc: 'For asthma and allergic rhinitis. Blocks leukotrienes.', comp: [{ n: 'Montelukast Sodium', r: 'Active', a: '10mg' }, { n: 'MCC', r: 'Filler', a: '80mg' }, { n: 'Lactose', r: 'Filler', a: '30mg' }], subs: ['Montair (Cipla)', 'Singulair (MSD)', 'Montek (Sun)'] },
    'clopidogrel': { name: 'Clopidogrel', generic: 'Clopidogrel Bisulfate', cat: 'Antiplatelet', desc: 'Prevents blood clots after heart attack or stroke.', comp: [{ n: 'Clopidogrel Bisulfate', r: 'Active', a: '75mg' }, { n: 'MCC', r: 'Filler', a: '60mg' }, { n: 'Hypromellose', r: 'Coating', a: '10mg' }], subs: ['Plavix (Sanofi)', 'Clopilet (Sun)', 'Deplatt (Torrent)'] },
    'telmisartan': { name: 'Telmisartan', generic: 'Telmisartan', cat: 'ARB (Antihypertensive)', desc: 'Angiotensin receptor blocker for high blood pressure.', comp: [{ n: 'Telmisartan', r: 'Active', a: '40mg' }, { n: 'Sodium Hydroxide', r: 'Alkalizer', a: '5mg' }, { n: 'Meglumine', r: 'Solubilizer', a: '12mg' }], subs: ['Telma (Glenmark)', 'Telsartan (USV)', 'Cresar (Cipla)'] },
    'levothyroxine': { name: 'Levothyroxine', generic: 'Levothyroxine Sodium', cat: 'Thyroid Hormone', desc: 'Synthetic thyroid hormone replacement for hypothyroidism.', comp: [{ n: 'Levothyroxine Sodium', r: 'Active', a: '50mcg' }, { n: 'Lactose', r: 'Filler', a: '50mg' }, { n: 'MCC', r: 'Binder', a: '20mg' }], subs: ['Thyronorm (Abbott)', 'Eltroxin (GSK)', 'Thyrox (Macleods)'] },
    'metoprolol': { name: 'Metoprolol', generic: 'Metoprolol Succinate', cat: 'Beta Blocker', desc: 'For hypertension, angina, heart failure. Reduces heart rate.', comp: [{ n: 'Metoprolol Succinate', r: 'Active', a: '50mg' }, { n: 'MCC', r: 'Filler', a: '100mg' }, { n: 'Ethylcellulose', r: 'CR coating', a: '15mg' }], subs: ['Betaloc (AstraZeneca)', 'Met XL (Sun)', 'Seloken (AstraZeneca)'] },
    'enalapril': { name: 'Enalapril', generic: 'Enalapril Maleate', cat: 'ACE Inhibitor', desc: 'For hypertension and heart failure. Inhibits angiotensin-converting enzyme.', comp: [{ n: 'Enalapril Maleate', r: 'Active', a: '5mg' }, { n: 'Lactose', r: 'Filler', a: '40mg' }, { n: 'Starch', r: 'Disintegrant', a: '15mg' }], subs: ['Envas (Cadila)', 'Enam (Dr Reddys)', 'Vasotec (Merck)'] },
    'diclofenac': { name: 'Diclofenac', generic: 'Diclofenac Sodium', cat: 'NSAID', desc: 'Anti-inflammatory for pain, arthritis, and musculoskeletal conditions.', comp: [{ n: 'Diclofenac Sodium', r: 'Active', a: '50mg' }, { n: 'Lactose', r: 'Filler', a: '40mg' }, { n: 'Starch', r: 'Disintegrant', a: '20mg' }], subs: ['Voveran (Novartis)', 'Voltaren (Novartis)', 'Diclomax (Lupin)'] },
    'doxycycline': { name: 'Doxycycline', generic: 'Doxycycline Hyclate', cat: 'Antibiotic (Tetracycline)', desc: 'For acne, malaria prophylaxis, respiratory and urinary infections.', comp: [{ n: 'Doxycycline Hyclate', r: 'Active', a: '100mg' }, { n: 'MCC', r: 'Filler', a: '60mg' }, { n: 'Magnesium Stearate', r: 'Lubricant', a: '5mg' }], subs: ['Doxy-1 (Dr Reddys)', 'Doxt-SL (Dr Reddys)', 'Vibramycin (Pfizer)'] },
    'gabapentin': { name: 'Gabapentin', generic: 'Gabapentin', cat: 'Anticonvulsant/Neuropathic', desc: 'For epilepsy, neuropathic pain and restless leg syndrome.', comp: [{ n: 'Gabapentin', r: 'Active', a: '300mg' }, { n: 'Lactose', r: 'Filler', a: '50mg' }, { n: 'Corn Starch', r: 'Disintegrant', a: '20mg' }], subs: ['Neurontin (Pfizer)', 'Gabapin (Intas)', 'Gabator (Sun)'] },
    'sertraline': { name: 'Sertraline', generic: 'Sertraline Hydrochloride', cat: 'SSRI (Antidepressant)', desc: 'For depression, anxiety, PTSD and OCD. Serotonin reuptake inhibitor.', comp: [{ n: 'Sertraline HCl', r: 'Active', a: '50mg' }, { n: 'Calcium Phosphate', r: 'Filler', a: '60mg' }, { n: 'MCC', r: 'Binder', a: '25mg' }], subs: ['Zoloft (Pfizer)', 'Daxid (Sun)', 'Serta (Intas)'] },
    'fluoxetine': { name: 'Fluoxetine', generic: 'Fluoxetine Hydrochloride', cat: 'SSRI (Antidepressant)', desc: 'For major depression, OCD, bulimia and panic disorder.', comp: [{ n: 'Fluoxetine HCl', r: 'Active', a: '20mg' }, { n: 'Starch', r: 'Filler', a: '40mg' }, { n: 'Dimethicone', r: 'Anti-foam', a: '2mg' }], subs: ['Prozac (Eli Lilly)', 'Fludac (Cadila)', 'Flunil (Intas)'] },
    'ranitidine': { name: 'Ranitidine', generic: 'Ranitidine Hydrochloride', cat: 'H2 Blocker', desc: 'Reduces stomach acid for ulcers and GERD (note: recalled in some markets).', comp: [{ n: 'Ranitidine HCl', r: 'Active', a: '150mg' }, { n: 'MCC', r: 'Filler', a: '60mg' }, { n: 'Croscarmellose', r: 'Disintegrant', a: '15mg' }], subs: ['Zinetac (GSK)', 'Rantac (JB Chemicals)', 'Aciloc (Cadila)'] },
    'levofloxacin': { name: 'Levofloxacin', generic: 'Levofloxacin Hemihydrate', cat: 'Antibiotic (Fluoroquinolone)', desc: 'For pneumonia, sinusitis, UTIs and skin infections.', comp: [{ n: 'Levofloxacin Hemihydrate', r: 'Active', a: '500mg' }, { n: 'MCC', r: 'Filler', a: '80mg' }, { n: 'Crospovidone', r: 'Disintegrant', a: '25mg' }], subs: ['Levoflox (Cipla)', 'Tavanic (Sanofi)', 'Glevo (Glenmark)'] },
    'prednisolone': { name: 'Prednisolone', generic: 'Prednisolone', cat: 'Corticosteroid', desc: 'Anti-inflammatory steroid for asthma, arthritis, allergies, autoimmune diseases.', comp: [{ n: 'Prednisolone', r: 'Active', a: '5mg' }, { n: 'Lactose', r: 'Filler', a: '50mg' }, { n: 'Starch', r: 'Disintegrant', a: '15mg' }], subs: ['Wysolone (Pfizer)', 'Omnacortil (Macleods)', 'Predone (Sun)'] },
    'salbutamol': { name: 'Salbutamol', generic: 'Salbutamol Sulphate', cat: 'Bronchodilator', desc: 'Relieves bronchospasm in asthma and COPD. Beta-2 agonist.', comp: [{ n: 'Salbutamol Sulphate', r: 'Active', a: '2mg' }, { n: 'Lactose', r: 'Filler', a: '40mg' }, { n: 'Starch', r: 'Disintegrant', a: '10mg' }], subs: ['Asthalin (Cipla)', 'Ventolin (GSK)', 'Derihaler (Cipla)'] },
    'domperidone': { name: 'Domperidone', generic: 'Domperidone', cat: 'Antiemetic/Prokinetic', desc: 'For nausea, vomiting and gastroparesis. Blocks dopamine receptors.', comp: [{ n: 'Domperidone', r: 'Active', a: '10mg' }, { n: 'Lactose', r: 'Filler', a: '50mg' }, { n: 'MCC', r: 'Binder', a: '20mg' }], subs: ['Domstal (Torrent)', 'Vomistop (Cipla)', 'Motilium (Janssen)'] },
    'rabeprazole': { name: 'Rabeprazole', generic: 'Rabeprazole Sodium', cat: 'Proton Pump Inhibitor', desc: 'Reduces gastric acid for GERD, ulcers, H.pylori eradication.', comp: [{ n: 'Rabeprazole Sodium', r: 'Active', a: '20mg' }, { n: 'Mannitol', r: 'Filler', a: '40mg' }, { n: 'Magnesium Oxide', r: 'Alkalizer', a: '8mg' }], subs: ['Razo (Dr Reddys)', 'Rablet (Lupin)', 'Happi (Zydus)'] },
    'rosuvastatin': { name: 'Rosuvastatin', generic: 'Rosuvastatin Calcium', cat: 'Statin (Cholesterol)', desc: 'Potent statin for high cholesterol and cardiovascular prevention.', comp: [{ n: 'Rosuvastatin Calcium', r: 'Active', a: '10mg' }, { n: 'MCC', r: 'Filler', a: '60mg' }, { n: 'Lactose', r: 'Filler', a: '30mg' }], subs: ['Crestor (AstraZeneca)', 'Rosuvas (Ranbaxy)', 'Rozavel (Sun)'] },
    'glimepiride': { name: 'Glimepiride', generic: 'Glimepiride', cat: 'Sulfonylurea (Antidiabetic)', desc: 'Stimulates insulin release from pancreas for type 2 diabetes.', comp: [{ n: 'Glimepiride', r: 'Active', a: '2mg' }, { n: 'Lactose', r: 'Filler', a: '60mg' }, { n: 'Starch', r: 'Disintegrant', a: '20mg' }], subs: ['Amaryl (Sanofi)', 'Glimisave (Glenmark)', 'Glimpid (USV)'] },
    'cefixime': { name: 'Cefixime', generic: 'Cefixime Trihydrate', cat: 'Antibiotic (Cephalosporin)', desc: 'Treats UTIs, pharyngitis, bronchitis, gonorrhea.', comp: [{ n: 'Cefixime Trihydrate', r: 'Active', a: '200mg' }, { n: 'MCC', r: 'Filler', a: '80mg' }, { n: 'Sodium Starch Glycolate', r: 'Disintegrant', a: '15mg' }], subs: ['Taxim-O (Alkem)', 'Zifi (FDC)', 'Cefix (Sun)'] },
    'aceclofenac': { name: 'Aceclofenac', generic: 'Aceclofenac', cat: 'NSAID', desc: 'Anti-inflammatory for osteoarthritis, rheumatoid arthritis and pain.', comp: [{ n: 'Aceclofenac', r: 'Active', a: '100mg' }, { n: 'MCC', r: 'Filler', a: '70mg' }, { n: 'Croscarmellose Sodium', r: 'Disintegrant', a: '15mg' }], subs: ['Hifenac (Intas)', 'Zerodol (Ipca)', 'Acemiz (Sanofi)'] },
    'tramadol': { name: 'Tramadol', generic: 'Tramadol Hydrochloride', cat: 'Opioid Analgesic', desc: 'For moderate to severe pain. Centrally acting opioid.', comp: [{ n: 'Tramadol HCl', r: 'Active', a: '50mg' }, { n: 'MCC', r: 'Filler', a: '40mg' }, { n: 'Starch', r: 'Disintegrant', a: '15mg' }], subs: ['Ultracet (Janssen)', 'Contramal (Abbott)', 'Dolzam (Zydus)'] },
    'lisinopril': { name: 'Lisinopril', generic: 'Lisinopril Dihydrate', cat: 'ACE Inhibitor', desc: 'For hypertension, heart failure, post-MI.', comp: [{ n: 'Lisinopril Dihydrate', r: 'Active', a: '5mg' }, { n: 'Mannitol', r: 'Filler', a: '50mg' }, { n: 'Calcium Phosphate', r: 'Filler', a: '25mg' }], subs: ['Listril (Torrent)', 'Zestril (AstraZeneca)', 'Lipril (Lupin)'] },
    'warfarin': { name: 'Warfarin', generic: 'Warfarin Sodium', cat: 'Anticoagulant', desc: 'Blood thinner for DVT, PE, atrial fibrillation.', comp: [{ n: 'Warfarin Sodium', r: 'Active', a: '5mg' }, { n: 'Lactose', r: 'Filler', a: '40mg' }, { n: 'Starch', r: 'Disintegrant', a: '10mg' }], subs: ['Warf (Sun)', 'Coumadin (BMS)', 'Warfarin (Cipla)'] },
    'hydroxychloroquine': { name: 'Hydroxychloroquine', generic: 'Hydroxychloroquine Sulfate', cat: 'Antimalarial/DMARD', desc: 'For malaria, lupus and rheumatoid arthritis.', comp: [{ n: 'Hydroxychloroquine Sulfate', r: 'Active', a: '200mg' }, { n: 'Starch', r: 'Filler', a: '40mg' }, { n: 'Calcium Phosphate', r: 'Filler', a: '30mg' }], subs: ['HCQS (Ipca)', 'Plaquenil (Sanofi)', 'Oxcq (Zydus)'] },
    'sitagliptin': { name: 'Sitagliptin', generic: 'Sitagliptin Phosphate', cat: 'DPP-4 Inhibitor (Antidiabetic)', desc: 'For type 2 diabetes. Increases incretin levels.', comp: [{ n: 'Sitagliptin Phosphate', r: 'Active', a: '100mg' }, { n: 'MCC', r: 'Filler', a: '60mg' }, { n: 'Calcium Phosphate', r: 'Filler', a: '25mg' }], subs: ['Januvia (MSD)', 'Istavel (Sun)', 'Sitaglu (Glenmark)'] },
    'escitalopram': { name: 'Escitalopram', generic: 'Escitalopram Oxalate', cat: 'SSRI (Antidepressant)', desc: 'For depression and generalized anxiety disorder.', comp: [{ n: 'Escitalopram Oxalate', r: 'Active', a: '10mg' }, { n: 'MCC', r: 'Filler', a: '50mg' }, { n: 'Croscarmellose', r: 'Disintegrant', a: '10mg' }], subs: ['Nexito (Sun)', 'Cipralex (Lundbeck)', 'S-Celepra (Sun)'] },
    'alprazolam': { name: 'Alprazolam', generic: 'Alprazolam', cat: 'Benzodiazepine (Anxiolytic)', desc: 'For anxiety, panic disorder. Short-acting benzodiazepine.', comp: [{ n: 'Alprazolam', r: 'Active', a: '0.5mg' }, { n: 'Lactose', r: 'Filler', a: '50mg' }, { n: 'Starch', r: 'Disintegrant', a: '12mg' }], subs: ['Alprax (Torrent)', 'Trika (Dr Reddys)', 'Restyl (Sun)'] },
    'ondansetron': { name: 'Ondansetron', generic: 'Ondansetron Hydrochloride', cat: 'Antiemetic (5-HT3 Blocker)', desc: 'Prevents nausea and vomiting from chemo and surgery.', comp: [{ n: 'Ondansetron HCl', r: 'Active', a: '4mg' }, { n: 'Lactose', r: 'Filler', a: '40mg' }, { n: 'MCC', r: 'Binder', a: '20mg' }], subs: ['Emeset (Cipla)', 'Vomikind (Mankind)', 'Ondem (Alkem)'] },
    'fexofenadine': { name: 'Fexofenadine', generic: 'Fexofenadine Hydrochloride', cat: 'Antihistamine', desc: 'Non-sedating antihistamine for seasonal allergies.', comp: [{ n: 'Fexofenadine HCl', r: 'Active', a: '120mg' }, { n: 'MCC', r: 'Filler', a: '70mg' }, { n: 'Croscarmellose', r: 'Disintegrant', a: '15mg' }], subs: ['Allegra (Sanofi)', 'Fexova (Glenmark)', 'Altiva (Cipla)'] },
    'loperamide': { name: 'Loperamide', generic: 'Loperamide Hydrochloride', cat: 'Antidiarrheal', desc: 'Controls diarrhea by slowing gut movement.', comp: [{ n: 'Loperamide HCl', r: 'Active', a: '2mg' }, { n: 'Lactose', r: 'Filler', a: '40mg' }, { n: 'Starch', r: 'Disintegrant', a: '10mg' }], subs: ['Imodium (Janssen)', 'Eldoper (Elder)', 'Lopamide (Cipla)'] },
    'clonazepam': { name: 'Clonazepam', generic: 'Clonazepam', cat: 'Benzodiazepine', desc: 'For seizures, panic disorder, anxiety.', comp: [{ n: 'Clonazepam', r: 'Active', a: '0.5mg' }, { n: 'Lactose', r: 'Filler', a: '50mg' }, { n: 'Corn Starch', r: 'Disintegrant', a: '15mg' }], subs: ['Rivotril (Roche)', 'Clonotril (Torrent)', 'Zapiz (Intas)'] },
    'ofloxacin': { name: 'Ofloxacin', generic: 'Ofloxacin', cat: 'Antibiotic (Fluoroquinolone)', desc: 'For UTIs, respiratory and skin infections.', comp: [{ n: 'Ofloxacin', r: 'Active', a: '200mg' }, { n: 'MCC', r: 'Filler', a: '80mg' }, { n: 'Starch', r: 'Disintegrant', a: '20mg' }], subs: ['Oflox (Cipla)', 'Zenflox (Mankind)', 'Zanocin (Sun)'] },
    'duloxetine': { name: 'Duloxetine', generic: 'Duloxetine Hydrochloride', cat: 'SNRI (Antidepressant)', desc: 'For depression, neuropathic pain, fibromyalgia, anxiety.', comp: [{ n: 'Duloxetine HCl', r: 'Active', a: '30mg' }, { n: 'Sucrose', r: 'Core pellet', a: '50mg' }, { n: 'Hypromellose Phthalate', r: 'Enteric coat', a: '15mg' }], subs: ['Cymbalta (Eli Lilly)', 'Duzela (Sun)', 'Dulane (Intas)'] },
    'vildagliptin': { name: 'Vildagliptin', generic: 'Vildagliptin', cat: 'DPP-4 Inhibitor', desc: 'For type 2 diabetes, often combined with metformin.', comp: [{ n: 'Vildagliptin', r: 'Active', a: '50mg' }, { n: 'MCC', r: 'Filler', a: '60mg' }, { n: 'Magnesium Stearate', r: 'Lubricant', a: '4mg' }], subs: ['Galvus (Novartis)', 'Zomelis (Sun)', 'Jalra (USV)'] },
    'ivermectin': { name: 'Ivermectin', generic: 'Ivermectin', cat: 'Antiparasitic', desc: 'For parasitic worm infections, scabies, rosacea.', comp: [{ n: 'Ivermectin', r: 'Active', a: '12mg' }, { n: 'MCC', r: 'Filler', a: '50mg' }, { n: 'Starch', r: 'Disintegrant', a: '15mg' }], subs: ['Ivecop (Menarini)', 'Iverfast (Alkem)', 'Vermact (Mankind)'] },
    'naproxen': { name: 'Naproxen', generic: 'Naproxen Sodium', cat: 'NSAID', desc: 'Anti-inflammatory for arthritis, muscle pain, menstrual cramps.', comp: [{ n: 'Naproxen Sodium', r: 'Active', a: '500mg' }, { n: 'Povidone', r: 'Binder', a: '30mg' }, { n: 'MCC', r: 'Filler', a: '60mg' }], subs: ['Naprosyn (Roche)', 'Naxdom (Zydus)', 'Xenobid (Sun)'] },
    'cephalexin': { name: 'Cephalexin', generic: 'Cephalexin Monohydrate', cat: 'Antibiotic (Cephalosporin)', desc: 'First-gen cephalosporin for skin and respiratory infections.', comp: [{ n: 'Cephalexin Monohydrate', r: 'Active', a: '500mg' }, { n: 'MCC', r: 'Filler', a: '80mg' }, { n: 'Starch', r: 'Disintegrant', a: '20mg' }], subs: ['Sporidex (Ranbaxy)', 'Phexin (GSK)', 'Ceff (Lupin)'] },
    'vitamin d3': { name: 'Vitamin D3', generic: 'Cholecalciferol', cat: 'Vitamin Supplement', desc: 'For vitamin D deficiency, bone health, calcium absorption.', comp: [{ n: 'Cholecalciferol', r: 'Active', a: '60000 IU' }, { n: 'Refined Edible Oil', r: 'Vehicle', a: '—' }, { n: 'Gelatin', r: 'Capsule shell', a: '—' }], subs: ['D3 Must (Alkem)', 'Tayo (Cadila)', 'Uprise D3 (Alkem)'] },
    'iron folic acid': { name: 'Iron + Folic Acid', generic: 'Ferrous Fumarate + Folic Acid', cat: 'Haematinic', desc: 'For iron deficiency anemia and pregnancy supplementation.', comp: [{ n: 'Ferrous Fumarate', r: 'Active', a: '152mg' }, { n: 'Folic Acid', r: 'Active', a: '1.5mg' }, { n: 'Zinc Sulphate', r: 'Active', a: '61.8mg' }], subs: ['Orofer-XT (Emcure)', 'Dexorange (Franco-Indian)', 'Autrin (GSK)'] },
    'calcium carbonate': { name: 'Calcium + Vitamin D3', generic: 'Calcium Carbonate + Cholecalciferol', cat: 'Mineral Supplement', desc: 'For calcium deficiency, osteoporosis prevention.', comp: [{ n: 'Calcium Carbonate', r: 'Active', a: '1250mg' }, { n: 'Vitamin D3', r: 'Active', a: '250 IU' }, { n: 'Magnesium Hydroxide', r: 'Supplement', a: '100mg' }], subs: ['Shelcal (Torrent)', 'CCM (Cadila)', 'Calcimax (Meyer)'] },
    'cough syrup': { name: 'Dextromethorphan', generic: 'Dextromethorphan HBr', cat: 'Antitussive', desc: 'Cough suppressant acting on the cough center in the brain.', comp: [{ n: 'Dextromethorphan HBr', r: 'Active', a: '10mg/5ml' }, { n: 'Chlorpheniramine', r: 'Antihistamine', a: '2mg/5ml' }, { n: 'Phenylephrine', r: 'Decongestant', a: '5mg/5ml' }], subs: ['Benadryl (J&J)', 'Corex-DX (Pfizer)', 'Cheston Cold (Cipla)'] },
};

// Also create aliases for common brand names and misspellings
const BRAND_ALIASES = {
    'dolo': 'paracetamol', 'dolo 650': 'paracetamol', 'crocin': 'paracetamol', 'calpol': 'paracetamol',
    'brufen': 'ibuprofen', 'combiflam': 'ibuprofen', 'advil': 'ibuprofen',
    'azee': 'azithromycin', 'zithromax': 'azithromycin',
    'zyrtec': 'cetirizine', 'alerid': 'cetirizine', 'cetzine': 'cetirizine',
    'omez': 'omeprazole', 'pan 40': 'pantoprazole', 'pantocid': 'pantoprazole',
    'glycomet': 'metformin', 'glucophage': 'metformin',
    'ecosprin': 'aspirin', 'disprin': 'aspirin',
    'ciplox': 'ciprofloxacin', 'cifran': 'ciprofloxacin',
    'cozaar': 'losartan', 'repace': 'losartan',
    'norvasc': 'amlodipine', 'stamlo': 'amlodipine',
    'lipitor': 'atorvastatin', 'atorva': 'atorvastatin',
    'crestor': 'rosuvastatin', 'rosuvas': 'rosuvastatin',
    'thyronorm': 'levothyroxine', 'eltroxin': 'levothyroxine',
    'montair': 'montelukast', 'singulair': 'montelukast',
    'plavix': 'clopidogrel', 'deplatt': 'clopidogrel',
    'voveran': 'diclofenac', 'voltaren': 'diclofenac',
    'asthalin': 'salbutamol', 'ventolin': 'salbutamol',
    'allegra': 'fexofenadine',
    'nexito': 'escitalopram', 'cipralex': 'escitalopram',
    'zoloft': 'sertraline',
    'prozac': 'fluoxetine',
    'razo': 'rabeprazole',
    'taxim-o': 'cefixime', 'zifi': 'cefixime',
    'januvia': 'sitagliptin',
    'galvus': 'vildagliptin',
    'rivotril': 'clonazepam',
    'alprax': 'alprazolam', 'restyl': 'alprazolam',
    'emeset': 'ondansetron',
    'imodium': 'loperamide',
    'wysolone': 'prednisolone',
    'telma': 'telmisartan', 'cresar': 'telmisartan',
    'shelcal': 'calcium carbonate',
    'benadryl': 'cough syrup',
};

// Get ALL searchable names (generics + brands)
function getAllNames() {
    const names = new Set();
    for (const key of Object.keys(MEDICINE_DB)) {
        names.add(MEDICINE_DB[key].name);
    }
    for (const brand of Object.keys(BRAND_ALIASES)) {
        names.add(brand.charAt(0).toUpperCase() + brand.slice(1));
    }
    return Array.from(names);
}

// Levenshtein distance
function levenshtein(a, b) {
    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++)
        for (let j = 1; j <= a.length; j++)
            m[i][j] = b[i - 1] === a[j - 1] ? m[i - 1][j - 1] : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    return m[b.length][a.length];
}

// Format DB entry to rich response
function formatMedicine(entry) {
    return {
        name: entry.name,
        genericName: entry.generic,
        category: entry.cat,
        description: entry.desc,
        components: entry.comp.map(c => ({ name: c.n, role: c.r, amount: c.a })),
        substitutes: entry.subs.map(s => {
            const match = s.match(/^(.+)\s*\((.+)\)$/);
            if (match) {
                const parts = match[1].trim().split(' ');
                return { name: match[1].trim(), manufacturer: match[2].trim(), strength: '—' };
            }
            return { name: s, manufacturer: '—', strength: '—' };
        }),
    };
}

// SEARCH endpoint — fuzzy autocomplete
router.get('/search', (req, res) => {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) return res.json({ suggestions: getAllNames().slice(0, 15) });

    const allNames = getAllNames();
    const allKeys = [...Object.keys(MEDICINE_DB), ...Object.keys(BRAND_ALIASES)];

    // Exact substring matches first
    const exact = allNames.filter(n => n.toLowerCase().includes(q));

    // Fuzzy matches (Levenshtein ≤ 3)
    const fuzzy = [];
    for (const name of allNames) {
        if (exact.some(e => e.toLowerCase() === name.toLowerCase())) continue;
        const dist = levenshtein(q, name.toLowerCase());
        // Allow more tolerance for longer queries
        const threshold = Math.min(3, Math.max(2, Math.floor(q.length * 0.4)));
        if (dist <= threshold) fuzzy.push({ name, dist });
    }
    fuzzy.sort((a, b) => a.dist - b.dist);

    const results = [...exact, ...fuzzy.map(f => f.name)].slice(0, 10);
    res.json({ suggestions: results, fuzzyMatch: exact.length === 0 && fuzzy.length > 0 });
});

// LOOKUP endpoint — full medicine details
router.get('/lookup', async (req, res) => {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) return res.status(400).json({ error: 'Query required' });

    // Direct match
    if (MEDICINE_DB[q]) return res.json(formatMedicine(MEDICINE_DB[q]));

    // Brand alias
    if (BRAND_ALIASES[q]) return res.json(formatMedicine(MEDICINE_DB[BRAND_ALIASES[q]]));

    // Partial match
    const partial = Object.keys(MEDICINE_DB).find(k => k.includes(q) || q.includes(k));
    if (partial) return res.json(formatMedicine(MEDICINE_DB[partial]));

    // Brand partial
    const brandPartial = Object.keys(BRAND_ALIASES).find(k => k.includes(q) || q.includes(k));
    if (brandPartial) return res.json(formatMedicine(MEDICINE_DB[BRAND_ALIASES[brandPartial]]));

    // Fuzzy match
    let best = null, bestDist = Infinity;
    for (const k of [...Object.keys(MEDICINE_DB), ...Object.keys(BRAND_ALIASES)]) {
        const d = levenshtein(q, k);
        if (d < bestDist && d <= 3) { bestDist = d; best = k; }
    }
    if (best) {
        const key = MEDICINE_DB[best] ? best : BRAND_ALIASES[best];
        const data = formatMedicine(MEDICINE_DB[key]);
        data.fuzzyMatch = true;
        data.originalQuery = q;
        data.matchedAs = MEDICINE_DB[key].name;
        return res.json(data);
    }

    // OpenFDA fallback
    try {
        const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(q)}"+openfda.generic_name:"${encodeURIComponent(q)}"&limit=1`;
        const resp = await fetch(url);
        if (resp.ok) {
            const body = await resp.json();
            if (body.results && body.results.length > 0) {
                const r = body.results[0];
                const openfda = r.openfda || {};
                return res.json({
                    name: (openfda.brand_name || [q])[0],
                    genericName: (openfda.generic_name || ['Unknown'])[0],
                    category: (openfda.pharm_class_epc || ['Pharmaceutical'])[0],
                    description: (r.description || r.indications_and_usage || ['Drug information from FDA database'])[0].slice(0, 300),
                    components: (openfda.substance_name || []).map(s => ({ name: s, role: 'Active ingredient', amount: '—' })),
                    substitutes: [],
                    source: 'OpenFDA',
                });
            }
        }
    } catch (e) { /* OpenFDA failed, return not found */ }

    res.status(404).json({ error: 'Medicine not found', query: q });
});

module.exports = router;
