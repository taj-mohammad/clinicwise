/** Realistic Indian reference data used by the seed. No placeholder text anywhere. */

export const CITIES = [
  { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', pincode: '400053', lat: 19.1136, lng: 72.8697 },
  { city: 'Pune', district: 'Pune', state: 'Maharashtra', pincode: '411004', lat: 18.5204, lng: 73.8567 },
  { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560034', lat: 12.9279, lng: 77.6271 },
  { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', pincode: '500034', lat: 17.4239, lng: 78.4738 },
  { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pincode: '600020', lat: 13.0067, lng: 80.2570 },
  { city: 'Delhi', district: 'South Delhi', state: 'Delhi', pincode: '110017', lat: 28.5355, lng: 77.2100 },
  { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', pincode: '380015', lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', pincode: '302015', lat: 26.9124, lng: 75.7873 },
  { city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh', pincode: '226010', lat: 26.8467, lng: 80.9462 },
  { city: 'Kochi', district: 'Ernakulam', state: 'Kerala', pincode: '682016', lat: 9.9312, lng: 76.2673 },
];

export const SPECIALTIES = [
  { key: 'general_physician', name: 'General Physician' },
  { key: 'paediatrics', name: 'Paediatrics' },
  { key: 'cardiology', name: 'Cardiology' },
  { key: 'dermatology', name: 'Dermatology' },
  { key: 'orthopaedics', name: 'Orthopaedics' },
  { key: 'gynaecology', name: 'Obstetrics & Gynaecology' },
  { key: 'ent', name: 'ENT' },
  { key: 'ophthalmology', name: 'Ophthalmology' },
  { key: 'diabetology', name: 'Diabetology & Endocrinology' },
  { key: 'psychiatry', name: 'Psychiatry' },
  { key: 'pulmonology', name: 'Pulmonology' },
  { key: 'gastroenterology', name: 'Gastroenterology' },
];

export const CLINIC_NAMES = [
  'Arogya Family Clinic', 'Sanjeevani Polyclinic', 'Aastha Medical Centre',
  'Sparsh Care Clinic', 'Nirogam Health Centre', 'Sushrut Clinic',
  'Vatsalya Child & Family Care', 'Anand Multispeciality Clinic',
  'Swasthya Sadan', 'Charaka Care Clinic',
];

export const MALE_FIRST = ['Aarav','Vihaan','Arjun','Rohan','Karthik','Aditya','Rahul','Nikhil','Siddharth','Manish','Vikram','Ananth','Rajesh','Suresh','Imran','Farhan','Joseph','Prakash','Devendra','Yash'];
export const FEMALE_FIRST = ['Ananya','Diya','Meera','Kavya','Priya','Shruti','Neha','Divya','Aishwarya','Pooja','Sneha','Lakshmi','Fatima','Zoya','Anita','Rekha','Sunita','Nandini','Ritu','Swati'];
export const SURNAMES = ['Sharma','Verma','Patel','Reddy','Iyer','Nair','Gupta','Mehta','Deshpande','Kulkarni','Chatterjee','Banerjee','Singh','Khan','Pillai','Joshi','Rao','Bhat','Kapoor','Thakur','Menon','Shetty','Das','Mishra','Agarwal'];

export const QUALIFICATIONS = [
  'MBBS, MD (General Medicine)', 'MBBS, DCH, MD (Paediatrics)', 'MBBS, MD, DM (Cardiology)',
  'MBBS, MD (Dermatology)', 'MBBS, MS (Orthopaedics)', 'MBBS, MS (Obstetrics & Gynaecology)',
  'MBBS, MS (ENT)', 'MBBS, MS (Ophthalmology)', 'MBBS, MD (Medicine), Fellowship in Diabetology',
  'MBBS, MD (Psychiatry)', 'MBBS, MD (Pulmonary Medicine)', 'MBBS, MD, DM (Gastroenterology)',
];

export const MEDICINES = [
  { name: 'Dolo 650', generic: 'Paracetamol', strength: '650 mg', form: 'Tablet' },
  { name: 'Augmentin 625 Duo', generic: 'Amoxicillin + Clavulanic Acid', strength: '625 mg', form: 'Tablet' },
  { name: 'Pan 40', generic: 'Pantoprazole', strength: '40 mg', form: 'Tablet' },
  { name: 'Montair LC', generic: 'Montelukast + Levocetirizine', strength: '10 mg/5 mg', form: 'Tablet' },
  { name: 'Glycomet GP 1', generic: 'Metformin + Glimepiride', strength: '500 mg/1 mg', form: 'Tablet' },
  { name: 'Telma 40', generic: 'Telmisartan', strength: '40 mg', form: 'Tablet' },
  { name: 'Rosuvas 10', generic: 'Rosuvastatin', strength: '10 mg', form: 'Tablet' },
  { name: 'Zifi 200', generic: 'Cefixime', strength: '200 mg', form: 'Tablet' },
  { name: 'Shelcal 500', generic: 'Calcium Carbonate + Vitamin D3', strength: '500 mg', form: 'Tablet' },
  { name: 'Ecosprin 75', generic: 'Aspirin', strength: '75 mg', form: 'Tablet' },
  { name: 'Azithral 500', generic: 'Azithromycin', strength: '500 mg', form: 'Tablet' },
  { name: 'Ascoril LS', generic: 'Ambroxol + Levosalbutamol + Guaifenesin', strength: '', form: 'Syrup' },
  { name: 'Thyronorm 50', generic: 'Levothyroxine', strength: '50 mcg', form: 'Tablet' },
  { name: 'Cetzine', generic: 'Cetirizine', strength: '10 mg', form: 'Tablet' },
  { name: 'Neurobion Forte', generic: 'Vitamin B Complex', strength: '', form: 'Tablet' },
];

export const LAB_TESTS = [
  { code: 'CBC', name: 'Complete Blood Count', category: 'Haematology', sample: 'Whole Blood (EDTA)', tat: 6, price: 350 },
  { code: 'FBS', name: 'Fasting Blood Sugar', category: 'Biochemistry', sample: 'Plasma (Fluoride)', tat: 4, price: 120 },
  { code: 'HBA1C', name: 'Glycated Haemoglobin (HbA1c)', category: 'Biochemistry', sample: 'Whole Blood (EDTA)', tat: 12, price: 550 },
  { code: 'LFT', name: 'Liver Function Test', category: 'Biochemistry', sample: 'Serum', tat: 8, price: 700 },
  { code: 'KFT', name: 'Kidney Function Test', category: 'Biochemistry', sample: 'Serum', tat: 8, price: 650 },
  { code: 'LIPID', name: 'Lipid Profile', category: 'Biochemistry', sample: 'Serum (Fasting)', tat: 8, price: 600 },
  { code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'Immunoassay', sample: 'Serum', tat: 12, price: 300 },
  { code: 'VITD', name: 'Vitamin D (25-OH)', category: 'Immunoassay', sample: 'Serum', tat: 24, price: 1200 },
  { code: 'URINE', name: 'Urine Routine & Microscopy', category: 'Clinical Pathology', sample: 'Urine', tat: 4, price: 200 },
  { code: 'CXR', name: 'Chest X-Ray PA View', category: 'Radiology', sample: 'NA', tat: 2, price: 400 },
];

export const COMPLAINTS = [
  'Fever with chills for 3 days', 'Dry cough and sore throat since a week',
  'Persistent headache and giddiness', 'Burning sensation in upper abdomen after meals',
  'Lower back pain radiating to the right leg', 'Breathlessness on climbing stairs',
  'Itchy rash over both forearms', 'Routine diabetes follow-up',
  'Blood pressure review and medicine refill', 'Loose motions since yesterday',
  'Pain and swelling in the right knee', 'Irregular menstrual cycles for 3 months',
];

export const DIAGNOSES = [
  { code: 'J06.9', label: 'Acute upper respiratory infection, unspecified' },
  { code: 'E11.9', label: 'Type 2 diabetes mellitus without complications' },
  { code: 'I10', label: 'Essential (primary) hypertension' },
  { code: 'K21.9', label: 'Gastro-oesophageal reflux disease without oesophagitis' },
  { code: 'M54.5', label: 'Low back pain' },
  { code: 'A09', label: 'Infectious gastroenteritis and colitis, unspecified' },
  { code: 'L23.9', label: 'Allergic contact dermatitis, unspecified cause' },
  { code: 'J45.9', label: 'Asthma, unspecified' },
  { code: 'E03.9', label: 'Hypothyroidism, unspecified' },
  { code: 'M17.1', label: 'Unilateral primary osteoarthritis of knee' },
];

export const ADVICE_TEMPLATES = [
  { category: 'Hydration', title: 'Drink more water', en: 'Drink at least 2.5 to 3 litres of water through the day. Increase intake if you have fever or are working outdoors.', hi: 'दिन भर में कम से कम 2.5 से 3 लीटर पानी पिएं। बुखार होने पर या धूप में काम करने पर मात्रा बढ़ाएं।' },
  { category: 'Rest', title: 'Take adequate rest', en: 'Rest at home for the next 48 hours and avoid strenuous activity until the fever settles.', hi: 'अगले 48 घंटे घर पर आराम करें और बुखार उतरने तक भारी काम से बचें।' },
  { category: 'Sleep', title: 'Sleep hygiene', en: 'Aim for 7 to 8 hours of sleep. Keep a fixed bedtime and avoid screens for an hour before sleeping.', hi: '7 से 8 घंटे की नींद लें। सोने का समय तय रखें और सोने से एक घंटा पहले स्क्रीन से दूर रहें।' },
  { category: 'Lifestyle', title: 'Stop smoking', en: 'Stop smoking completely. It is the single most effective step for your lungs and heart.', hi: 'धूम्रपान पूरी तरह बंद करें। आपके फेफड़ों और हृदय के लिए यह सबसे प्रभावी कदम है।' },
  { category: 'Lifestyle', title: 'Avoid alcohol', en: 'Avoid alcohol while you are on this course of medicines.', hi: 'इन दवाओं के कोर्स के दौरान शराब से पूरी तरह परहेज़ करें।' },
  { category: 'Monitoring', title: 'Monitor blood pressure', en: 'Check your blood pressure twice a week in the morning before medicines and note the readings.', hi: 'सप्ताह में दो बार सुबह दवा लेने से पहले रक्तचाप जांचें और रीडिंग लिखकर रखें।' },
  { category: 'Monitoring', title: 'Monitor blood glucose', en: 'Check fasting and post-meal sugar twice a week and bring the log to your next visit.', hi: 'सप्ताह में दो बार खाली पेट और खाने के बाद शुगर जांचें और अगली विज़िट पर रिकॉर्ड लाएं।' },
  { category: 'Medicine', title: 'Take medicine before food', en: 'Take the marked medicine 30 minutes before food on an empty stomach.', hi: 'चिह्नित दवा भोजन से 30 मिनट पहले खाली पेट लें।' },
  { category: 'Medicine', title: 'Take medicine after food', en: 'Take the marked medicine within 30 minutes after a meal to avoid acidity.', hi: 'अम्लता से बचने के लिए चिह्नित दवा भोजन के 30 मिनट के भीतर लें।' },
  { category: 'Hygiene', title: 'Hand and food hygiene', en: 'Wash hands before meals, drink boiled or filtered water, and avoid outside cut fruit for a week.', hi: 'भोजन से पहले हाथ धोएं, उबला या फ़िल्टर किया पानी पिएं, और एक सप्ताह तक बाहर का कटा फल न लें।' },
  { category: 'Activity', title: 'Physical activity', en: 'Walk briskly for 30 minutes on at least 5 days a week.', hi: 'सप्ताह में कम से कम 5 दिन 30 मिनट तेज़ चलें।' },
  { category: 'Follow-up', title: 'Return if worse', en: 'Return sooner if the fever crosses 102°F, breathlessness increases, or you cannot keep fluids down.', hi: 'यदि बुखार 102°F से ऊपर जाए, सांस फूलना बढ़े, या तरल पदार्थ न टिकें तो तुरंत दिखाएं।' },
];

export const EXPENSE_CATEGORIES = [
  { key: 'rent', name: 'Rent' }, { key: 'electricity', name: 'Electricity' },
  { key: 'salary', name: 'Salary' }, { key: 'supplies', name: 'Medical Supplies' },
  { key: 'maintenance', name: 'Maintenance' }, { key: 'marketing', name: 'Marketing' },
  { key: 'equipment', name: 'Equipment' }, { key: 'other', name: 'Other' },
];

export const DESIGNATIONS = [
  'Receptionist', 'Staff Nurse', 'Clinic Manager', 'Accountant',
  'Pharmacy Assistant', 'Lab Technician', 'Housekeeping Supervisor',
];
